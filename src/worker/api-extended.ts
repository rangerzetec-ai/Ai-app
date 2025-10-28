import { Hono } from "hono";

const app = new Hono();

// Get appointments with lead data included
app.get("/api/appointments-with-leads", async (c) => {
  try {
    const stmt = (c.env as any).DB.prepare(`
      SELECT 
        a.*,
        l.first_name as lead_first_name,
        l.last_name as lead_last_name,
        l.email as lead_email,
        l.phone as lead_phone,
        l.status as lead_status,
        cl.first_name as client_first_name,
        cl.last_name as client_last_name
      FROM appointments a
      LEFT JOIN leads l ON a.lead_id = l.id
      LEFT JOIN clients cl ON a.client_id = cl.id
      ORDER BY a.appointment_date DESC
    `);
    
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch appointments with lead data" }, 500);
  }
});

// Get leads with appointment counts
app.get("/api/leads-with-appointments", async (c) => {
  try {
    const stmt = (c.env as any).DB.prepare(`
      SELECT 
        l.*,
        COUNT(a.id) as appointment_count,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status IN ('scheduled', 'confirmed') AND a.appointment_date > datetime('now') THEN 1 END) as upcoming_appointments
      FROM leads l
      LEFT JOIN appointments a ON l.id = a.lead_id
      GROUP BY l.id
      ORDER BY l.created_at DESC
    `);
    
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch leads with appointment data" }, 500);
  }
});

// File upload endpoint for improvement sketches
app.post("/projects/:id/upload-sketch", async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get("sketch") as File;
    
    if (!file) {
      return c.json({ error: "No file uploaded" }, 400);
    }

    // For now, just return a mock response
    // In a real implementation, you would upload to R2 and save the URL
    const mockUrl = `sketches/${file.name}`;
    
    return c.json({
      improvement_sketch_url: mockUrl,
      improvement_sketch_filename: file.name
    });
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Upload failed" }, 500);
  }
});

// Update pier placements endpoint
app.put("/projects/:id/pier-placements", async (c) => {
  try {
    await c.req.json();
    
    // For now, just return success
    // In a real implementation, you would save to database
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Save error:", error);
    return c.json({ error: "Failed to save pier placements" }, 500);
  }
});

// Convert lead to client endpoint
app.post("/api/appointments/:id/convert-lead", async (c) => {
  try {
    const appointmentId = c.req.param("id");
    
    // Get appointment and lead data
    const appointmentStmt = (c.env as any).DB.prepare(`
      SELECT a.*, l.* 
      FROM appointments a 
      JOIN leads l ON a.lead_id = l.id 
      WHERE a.id = ?
    `);
    
    const appointment = await appointmentStmt.bind(appointmentId).first();
    
    if (!appointment) {
      return c.json({ error: "Appointment not found" }, 404);
    }
    
    if (appointment.is_lead_converted) {
      return c.json({ error: "Lead already converted" }, 400);
    }
    
    // Create client from lead data
    const createClientStmt = (c.env as any).DB.prepare(`
      INSERT INTO clients (
        first_name, last_name, email, phone, address_line1, address_line2,
        city, state, zip_code, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const clientResult = await createClientStmt.bind(
      appointment.first_name,
      appointment.last_name,
      appointment.email || null,
      appointment.phone || null,
      appointment.address_line1 || null,
      appointment.address_line2 || null,
      appointment.city || null,
      appointment.state || null,
      appointment.zip_code || null,
      appointment.notes || null
    ).run();
    
    if (!clientResult.success) {
      return c.json({ error: "Failed to create client" }, 500);
    }
    
    const clientId = clientResult.meta.last_row_id;
    
    // Update appointment to link to client
    const updateAppointmentStmt = (c.env as any).DB.prepare(`
      UPDATE appointments 
      SET client_id = ?, is_lead_converted = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const updateResult = await updateAppointmentStmt.bind(clientId, appointmentId).run();
    
    if (updateResult.success) {
      const newClient = await (c.env as any).DB.prepare("SELECT * FROM clients WHERE id = ?")
        .bind(clientId).first();
      
      return c.json({ 
        converted: true, 
        client: newClient,
        message: "Lead successfully converted to client"
      });
    } else {
      return c.json({ error: "Failed to update appointment" }, 500);
    }
  } catch (error) {
    console.error("Conversion error:", error);
    return c.json({ error: "Failed to convert lead" }, 500);
  }
});

export default app;
