import { Hono } from "hono";
import { listDrives, mountDrive, ejectDrive } from "../lib/system.js";

export const drives = new Hono();

// List all mounted/available removable drives
drives.get("/", async (c) => {
  try {
    const driveList = await listDrives();
    return c.json(driveList);
  } catch (err) {
    return c.json({ error: "Failed to list drives" }, 500);
  }
});

// Mount a drive by device path or label
drives.post("/mount", async (c) => {
  const { device } = await c.req.json<{ device: string }>();
  if (!device) return c.json({ error: "device is required" }, 400);

  try {
    const result = await mountDrive(device);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Mount failed";
    return c.json({ error: message }, 500);
  }
});

// Safely eject a drive by device path or label
drives.post("/eject", async (c) => {
  const { device } = await c.req.json<{ device: string }>();
  if (!device) return c.json({ error: "device is required" }, 400);

  try {
    const result = await ejectDrive(device);
    return c.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Eject failed";
    return c.json({ error: message }, 500);
  }
});
