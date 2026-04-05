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
 * Determine whether a partition is an external/removable storage device.
 *
 * Excluded:
 *  - Boot SD card (mmcblk0)
 *  - RAID member disks (fstype linux_raid_member)
 *  - Software RAID arrays (md*)
 *  - System partitions mounted at /, /boot/*, /var/*, /run/*
 *  - Swap / zram
 */
function isExternalDevice(
  parentDisk: Record<string, any>,
  partition: Record<string, any>
): boolean {
  const parentName: string = parentDisk.name || "";
  const partName: string = partition.name || "";
  const fstype: string = partition.fstype || "";
  const mountpoint: string = partition.mountpoint || "";

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

  // Skip system mount points — anything already mounted at /, /boot, /var, /run, /srv, /export
  if (mountpoint) {
    const systemPrefixes = ["/boot", "/var", "/run", "/srv", "/export"];
    if (mountpoint === "/" || systemPrefixes.some((p) => mountpoint.startsWith(p))) {
      return false;
    }
  }

  // Must have a usable filesystem (vfat, exfat, ntfs3, ext4, etc.)
  if (!fstype) return false;

  return true;
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

        const mountpoint = part.mountpoint || "";
        const mounted = !!mountpoint;

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
          label: part.label || part.name,
          device: `/dev/${part.name}`,
          mountpoint,
          fstype: part.fstype,
          size: part.size || "0",
          used,
          available,
          mounted,
        });
      }

      // Also check if the disk itself (no partitions) is an external device
      // Some USB drives have no partition table — the filesystem is on the disk directly
      if (children.length === 0 && dev.type === "disk") {
        if (isExternalDevice(dev, dev)) {
          const mountpoint = dev.mountpoint || "";
          const mounted = !!mountpoint;

          drives.push({
            label: dev.label || dev.name,
            device: `/dev/${dev.name}`,
            mountpoint,
            fstype: dev.fstype,
            size: dev.size || "0",
            used: "0",
            available: "0",
            mounted,
          });
        }
      }
    }

    // Cross-check with /mnt/media for anything mounted outside of lsblk's view
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
  } catch {
    return [];
  }
}

export async function mountDrive(
  device: string
): Promise<{ success: boolean; mountpoint: string }> {
  const clean = validateDevice(device);

  // Get filesystem label and type
  const { stdout: labelOut } = await exec("lsblk", ["-no", "LABEL", clean]);
  const { stdout: fstypeOut } = await exec("lsblk", ["-no", "FSTYPE", clean]);
  const label = labelOut.trim().replace(/\s+/g, "_") || clean.replace(/^\/dev\//, "");
  const fstype = fstypeOut.trim();

  const mountpoint = `${MEDIA_DIR}/${label}`;
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
