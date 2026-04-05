# NAS Infrastructure

## Server

- **OS:** Debian 13 (trixie), OpenMediaVault
- **Host:** 192.168.1.150
- **User:** ayoola (uid=1000, sudo)
- **SSH:** `ssh -i ~/.ssh/id_ed25519 ayoola@192.168.1.150`

## Storage

- **RAID5** (`/dev/md0`, ext4, ~11TB): `/srv/dev-disk-by-uuid-d18681bc-4512-45a3-94b1-0650a76f9ce0`
- **Removable devices** auto-mount to `/mnt/media/<LABEL>`

## CopyParty

- **Binary:** `/home/linuxbrew/.linuxbrew/bin/copyparty` (v1.20.13, installed via Linuxbrew)
- **Config:** `/home/ayoola/.config/copyparty/copyparty.conf`
- **Port:** 3923
- **Service:** `systemd` unit at `/etc/systemd/system/copyparty.service`
- **Volumes:**
  - `/raid` -> RAID5 storage
  - `/media` -> Removable devices parent directory

### Config file

```ini
[global]
  i: 0.0.0.0
  p: 3923

[/raid]
  /srv/dev-disk-by-uuid-d18681bc-4512-45a3-94b1-0650a76f9ce0
  accs:
    r: *
    rw: *

[/media]
  /mnt/media
  accs:
    r: *
    rw: *
```

## Auto-mount System

### udev rule

`/etc/udev/rules.d/90-copyparty-automount.rules`

Triggers on block device partitions. Excludes boot SD (mmcblk0), RAID members (md*), and RAID member disks. Calls mount/unmount scripts.

### Mount script

`/usr/local/bin/copyparty-mount` — called by udev on device add. Gets filesystem label, creates mountpoint at `/mnt/media/<label>`, handles exfat/ntfs3/vfat with appropriate options.

### Unmount script

`/usr/local/bin/copyparty-unmount` — user-callable for safe device ejection. Accepts device path (`/dev/sda1`) or label (`NIKON_ZR`). Syncs, unmounts, removes empty mount directory. Shows currently mounted media when called with no args.

## Service Management

```bash
# Check status
systemctl status copyparty

# Restart
sudo systemctl restart copyparty

# View logs
journalctl -u copyparty -f

# Reload udev rules
sudo udevadm control --reload-rules
```
