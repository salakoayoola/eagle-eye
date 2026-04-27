import { execFile } from "node:child_process";
import { readdir, mkdir, rmdir } from "node:fs/promises";
import { promisify } from "node:util";

const exec = promisify(execFile);

const MEDIA_DIR = process.env.MEDIA_MOUNT_DIR || "/mnt/media";

export interface Drive {
  label: string;
  device: string;
  mountpoint: string;
  fstype: string;
  size: string;
  used: string;
  available: string;
  mounted: boolean;
}

// Validate device/label input to prevent command injection
function validateDevice(device: string): string {
  const clean = device.replace(/[^a-zA-Z0-9_\-\/\.]/g, "");
  if (clean !== device || device.includes("..")) {
    throw new Error("Invalid device identifier");
  }
  return clean;
}

/**
 * Probe device metadata (label, fstype) using blkid
 * Fallback for when lsblk fails to see metadata inside container
 */
async function getDeviceMetadata(device: string): Promise<{ label: string; fstype: string }> {
  try {
    const { stdout } = await exec("/sbin/blkid", [device]);
    // Format: /dev/sda: LABEL="EAGLE-EYE" UUID="..." TYPE="exfat"
    const labelMatch = stdout.match(/LABEL="([^"]+)"/);
    const typeMatch = stdout.match(/TYPE="([^"]+)"/);
    
    return {
      label: labelMatch ? labelMatch[1] : "",
      fstype: typeMatch ? typeMatch[1] : "",
    };
  } catch {
    return { label: "", fstype: "" };
  }
}

/**
 * Determine whether a partition is an external/removable storage device.
 */
function isExternalDevice(
  parentDisk: Record<string, any>,
  partition: Record<string, any>
): boolean {
  const parentName: string = parentDisk.name || "";
  const partName: string = partition.name || "";
  const fstype: string = partition.fstype || "";
  const mountpoint: string = partition.mountpoint || "";
  const isRemovable: boolean = parentDisk.rm || partition.rm || false;

  // Skip boot SD card (mmcblk0 and its partitions)
  if (parentName.startsWith("mmcblk0")) return false;

  // Skip RAID member disks
  if (
    fstype === "linux_raid_member" ||
    parentDisk.fstype === "linux_raid_member"
  )
    return false;

  // Skip software RAID arrays themselves
  if (parentName.startsWith("md") || partName.startsWith("md")) return false;

  // Skip swap/zram
  if (fstype === "swap" || parentName.startsWith("zram")) return false;

  // Skip system mount points
  if (mountpoint) {
    const systemPrefixes = ["/boot", "/var", "/run", "/srv", "/export"];
    if (mountpoint === "/" || systemPrefixes.some((p) => mountpoint.startsWith(p))) {
      return false;
    }
  }

  // Allow if it's removable OR already mounted in /media OR has a known fstype
  if (isRemovable || mountpoint.startsWith(MEDIA_DIR) || fstype) {
    return true;
  }

  return false;
}

export async function listDrives(): Promise<Drive[]> {
  try {
    const { stdout } = await exec("lsblk", [
      "-J",
      "-o",
      "NAME,LABEL,FSTYPE,SIZE,MOUNTPOINT,TYPE,RM,HOTPLUG",
      "--bytes",
    ]);

    const data = JSON.parse(stdout);
    const drives: Drive[] = [];

    for (const dev of data.blockdevices || []) {
      // Check partitions of this disk
      const children = dev.children || [];
      for (const part of children) {
        if (part.type !== "part") continue;
        if (!isExternalDevice(dev, part)) continue;

        const device = `/dev/${part.name}`;
        const mountpoint = part.mountpoint || "";
        const mounted = !!mountpoint;

        let label = part.label || part.name;
        let fstype = part.fstype || "";

        // Probe metadata if missing (common in containers)
        if (!label || !fstype) {
          const meta = await getDeviceMetadata(device);
          if (meta.label) label = meta.label;
          if (meta.fstype) fstype = meta.fstype;
        }

        let used = "0";
        let available = "0";
        if (mounted) {
          try {
            const { stdout: dfOut } = await exec("df", [
              "-B1",
              "--output=used,avail",
              mountpoint,
            ]);
            const lines = dfOut.trim().split("\n");
            if (lines.length > 1) {
              const [u, a] = lines[1].trim().split(/\s+/);
              used = u;
              available = a;
            }
          } catch {
            // df may fail, that's ok
          }
        }

        drives.push({
          label,
          device,
          mountpoint,
          fstype,
          size: part.size || "0",
          used,
          available,
          mounted,
        });
      }

      // Also check if the disk itself (no partitions) is an external device
      if (children.length === 0 && dev.type === "disk") {
        if (isExternalDevice(dev, dev)) {
          const device = `/dev/${dev.name}`;
          const mountpoint = dev.mountpoint || "";
          const mounted = !!mountpoint;

          let label = dev.label || dev.name;
          let fstype = dev.fstype || "";

          if (!label || !fstype) {
            const meta = await getDeviceMetadata(device);
            if (meta.label) label = meta.label;
            if (meta.fstype) fstype = meta.fstype;
          }

          drives.push({
            label,
            device,
            mountpoint,
            fstype,
            size: dev.size || "0",
            used: "0",
            available: "0",
            mounted,
          });
        }
      }
    }

    // Cross-check with /media for anything mounted outside of lsblk's view
    try {
      const entries = await readdir(MEDIA_DIR);
      for (const entry of entries) {
        if (!drives.some((d) => d.label === entry || d.mountpoint === `${MEDIA_DIR}/${entry}`)) {
          drives.push({
            label: entry,
            device: "",
            mountpoint: `${MEDIA_DIR}/${entry}`,
            fstype: "",
            size: "0",
            used: "0",
            available: "0",
            mounted: true,
          });
        }
      }
    } catch {
      // Media dir may not exist
    }

    return drives;
  } catch (err) {
    console.error("Failed to list drives:", err);
    return [];
  }
}

export async function mountDrive(
  device: string
): Promise<{ success: boolean; mountpoint: string }> {
  const clean = validateDevice(device);

  // Get filesystem label and type (probe if lsblk returns empty)
  let { stdout: labelOut } = await exec("lsblk", ["-no", "LABEL", clean]);
  let { stdout: fstypeOut } = await exec("lsblk", ["-no", "FSTYPE", clean]);
  
  let label = labelOut.trim();
  let fstype = fstypeOut.trim();

  if (!label || !fstype) {
    const meta = await getDeviceMetadata(clean);
    if (!label) label = meta.label;
    if (!fstype) fstype = meta.fstype;
  }

  const finalLabel = label.replace(/\s+/g, "_") || clean.replace(/^\/dev\//, "");
  const mountpoint = `${MEDIA_DIR}/${finalLabel}`;
  await mkdir(mountpoint, { recursive: true });

  // Mount with appropriate options per filesystem
  const mountArgs: string[] = [];
  switch (fstype) {
    case "exfat":
      mountArgs.push("-t", "exfat", "-o", "rw,relatime,fmask=0000,dmask=0000,uid=1000,gid=100");
      break;
    case "ntfs":
    case "ntfs3":
      mountArgs.push("-t", "ntfs3", "-o", "rw,relatime,uid=1000,gid=100");
      break;
    case "vfat":
      mountArgs.push("-t", "vfat", "-o", "rw,relatime,uid=1000,gid=100");
      break;
  }
  mountArgs.push(clean, mountpoint);

  await exec("mount", mountArgs);
  return { success: true, mountpoint };
}

export async function ejectDrive(
  device: string
): Promise<{ success: boolean }> {
  const clean = validateDevice(device);

  // Find mountpoint for this device
  const { stdout: findOut } = await exec("findmnt", ["-n", "-o", "TARGET", clean]);
  const mountpoint = findOut.trim();
  if (!mountpoint) {
    throw new Error(`${clean} is not mounted`);
  }

  await exec("sync", []);
  await exec("umount", [mountpoint]);

  // Clean up empty mount directory
  try {
    await rmdir(mountpoint);
  } catch {
    // Directory may not be empty or already removed
  }

  return { success: true };
}
