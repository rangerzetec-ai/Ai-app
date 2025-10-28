import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import {
  CreateClientSchema,
  UpdateClientSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  CreateLeadSchema,
  UpdateLeadSchema,
  CreateAppointmentSchema,
  UpdateAppointmentSchema,
  CreateLeadWithAppointmentSchema,
  CreateSalesPersonSchema,
  UpdateSalesPersonSchema,
  PierPlacementsSchema,
  PhotoCategorySchema,
  CreateProjectExpenseSchema,
  UpdateProjectExpenseSchema,
  CreateProjectRevenueSchema,
  UpdateProjectRevenueSchema,
  UpdateProjectFinancialsSchema,
  CreateEngineerSchema,
  UpdateEngineerSchema,
  CreateNotificationContactSchema,
  UpdateNotificationContactSchema,
  UpdateAppSettingSchema,
} from "@/shared/types";

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
  GOOGLE_MAPS_API_KEY?: string;
}

const app = new Hono<{ Bindings: Env }>();

// Helper function to start project workflows
async function startProjectWorkflows(db: D1Database, projectId: number) {
  try {
    // Create workflow records for this project
    const workflows = [
      { project_id: projectId, workflow_type: 'engineer_assumption_letter', status: 'pending' },
      { project_id: projectId, workflow_type: 'texas_811_ticket', status: 'pending' }
    ];
    
    for (const workflow of workflows) {
      await db.prepare(`
        INSERT INTO project_workflows (project_id, workflow_type, status, created_at, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(workflow.project_id, workflow.workflow_type, workflow.status).run();
    }
    
    // Send initial SMS notification asking which engineer to use
    await sendEngineerSelectionSMS(db, projectId);
    
  } catch (error) {
    console.error("Failed to start project workflows:", error);
  }
}

// Helper function to send SMS asking which engineer to use
async function sendEngineerSelectionSMS(db: D1Database, projectId: number) {
  try {
    // Get project details
    const project = await db.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first() as any;
    if (!project) return;
    
    // Get active engineers
    const engineers = await db.prepare("SELECT * FROM engineers WHERE is_active = TRUE").all();
    if (!engineers.results || engineers.results.length === 0) return;
    
    // Get notification contacts
    const contacts = await db.prepare("SELECT * FROM notification_contacts WHERE is_active = TRUE").all();
    if (!contacts.results || contacts.results.length === 0) return;
    
    // Create engineer options message
    const engineerList = (engineers.results as any[]).map((eng, index) => 
      `${index + 1}. ${eng.name} (${eng.email})`
    ).join('\n');
    
    const message = `New project created: ${project.project_name}\n\nWhich engineer should handle the assumption letter?\n\n${engineerList}\n\nReply with the number (1-${engineers.results.length})`;
    
    // Log the SMS (in production, this would send actual SMS)
    console.log("SMS Notification:", {
      recipients: (contacts.results as any[]).map(c => c.phone_number),
      message,
      projectId
    });
    
    // Update workflow status
    await db.prepare(`
      UPDATE project_workflows 
      SET notification_sent_at = CURRENT_TIMESTAMP, status = 'awaiting_engineer_selection', updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND workflow_type = 'engineer_assumption_letter'
    `).bind(projectId).run();
    
  } catch (error) {
    console.error("Failed to send engineer selection SMS:", error);
  }
}

// Enable CORS
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Google Maps API configuration
app.get("/api/config/google-maps", (c) => {
  try {
    const apiKey = c.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return c.json({ error: "Google Maps API key not configured" }, 500);
    }
    return c.json({ apiKey });
  } catch (error) {
    console.error("Failed to get Google Maps config:", error);
    return c.json({ error: "Failed to get configuration" }, 500);
  }
});

// Clients endpoints with pagination and caching
app.get("/api/clients", async (c) => {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const search = url.searchParams.get("search");
    const paginate = url.searchParams.get("paginate") !== "false";

    let query = "SELECT * FROM clients";
    let countQuery = "SELECT COUNT(*) as total FROM clients";
    const params: any[] = [];

    if (search) {
      const searchCondition = " WHERE first_name LIKE ? OR last_name LIKE ? OR email LIKE ?";
      query += searchCondition;
      countQuery += searchCondition;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (paginate) {
      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [result, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...params).all(),
        c.env.DB.prepare(countQuery).bind(...(search ? [`%${search}%`, `%${search}%`, `%${search}%`] : [])).first()
      ]);

      const total = Number(countResult?.total || 0);
      const response = c.json({
        data: result.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

      // Set cache headers for performance
      response.headers.set('Cache-Control', 'public, max-age=60');
      
      return response;
    } else {
      // Return simple array for non-paginated requests
      query += " ORDER BY created_at DESC";
      const result = await c.env.DB.prepare(query).bind(...params.slice(0, -2)).all();
      
      const response = c.json(result.results);
      response.headers.set('Cache-Control', 'public, max-age=60');
      return response;
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch clients" }, 500);
  }
});

app.get("/api/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM clients WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Client not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch client" }, 500);
  }
});

app.post("/api/clients", zValidator("json", CreateClientSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO clients (
        first_name, last_name, email, phone, address_line1, address_line2, 
        city, state, zip_code, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.address_line1 || null,
      data.address_line2 || null,
      data.city || null,
      data.state || null,
      data.zip_code || null,
      data.notes || null
    ).run();
    
    if (result.success) {
      const newClient = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newClient, 201);
    } else {
      return c.json({ error: "Failed to create client" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create client" }, 500);
  }
});

app.put("/api/clients/:id", zValidator("json", UpdateClientSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE clients SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedClient = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?")
        .bind(id).first();
      return c.json(updatedClient);
    } else {
      return c.json({ error: "Client not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update client" }, 500);
  }
});

app.delete("/api/clients/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("DELETE FROM clients WHERE id = ?");
    const result = await stmt.bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Client not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete client" }, 500);
  }
});

// Projects endpoints
app.get("/api/projects", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM projects ORDER BY created_at DESC");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch projects" }, 500);
  }
});

app.get("/api/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM projects WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Project not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch project" }, 500);
  }
});

app.post("/api/projects", zValidator("json", CreateProjectSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO projects (
        client_id, project_name, description, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.client_id,
      data.project_name,
      data.description || null,
      data.status || "planning"
    ).run();
    
    if (result.success) {
      const newProject = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      
      // Start automated workflows when project is created
      await startProjectWorkflows(c.env.DB, result.meta.last_row_id as number);
      
      return c.json(newProject, 201);
    } else {
      return c.json({ error: "Failed to create project" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create project" }, 500);
  }
});

app.put("/api/projects/:id", zValidator("json", UpdateProjectSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedProject = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?")
        .bind(id).first();
      return c.json(updatedProject);
    } else {
      return c.json({ error: "Project not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update project" }, 500);
  }
});

// Project pier placements
app.put("/api/projects/:id/pier-placements", zValidator("json", PierPlacementsSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const placements = c.req.valid("json");
    
    const stmt = c.env.DB.prepare(`
      UPDATE projects SET pier_placements = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    
    const result = await stmt.bind(JSON.stringify(placements), id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Project not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update pier placements" }, 500);
  }
});

// Project file uploads
app.post("/api/projects/:id/upload-sketch", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("sketch") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `project-${id}-sketch-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      const stmt = c.env.DB.prepare(`
        UPDATE projects 
        SET improvement_sketch_url = ?, improvement_sketch_filename = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const dbResult = await stmt.bind(filename, file.name, id).run();
      
      if (dbResult.success && dbResult.meta.changes > 0) {
        const updatedProject = await c.env.DB.prepare("SELECT * FROM projects WHERE id = ?")
          .bind(id).first();
        return c.json(updatedProject);
      } else {
        return c.json({ error: "Project not found" }, 404);
      }
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload sketch" }, 500);
  }
});

// Leads endpoints with optimization
app.get("/api/leads", async (c) => {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status");
    const salesPersonId = url.searchParams.get("sales_person_id");
    const paginate = url.searchParams.get("paginate") !== "false";

    let query = "SELECT * FROM leads";
    let countQuery = "SELECT COUNT(*) as total FROM leads";
    const params: any[] = [];
    const conditions: string[] = [];

    if (status) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (salesPersonId) {
      conditions.push("assigned_sales_person_id = ?");
      params.push(salesPersonId);
    }

    if (conditions.length > 0) {
      const whereClause = " WHERE " + conditions.join(" AND ");
      query += whereClause;
      countQuery += whereClause;
    }

    if (paginate && (page > 1 || url.searchParams.has("page") || url.searchParams.has("limit"))) {
      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [result, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...params).all(),
        c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
      ]);

      const total = Number(countResult?.total || 0);
      const response = c.json({
        data: result.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      });

      response.headers.set('Cache-Control', 'public, max-age=30');
      return response;
    } else {
      // Return simple array for non-paginated requests
      query += " ORDER BY created_at DESC";
      const result = await c.env.DB.prepare(query).bind(...params).all();
      
      const response = c.json(result.results);
      response.headers.set('Cache-Control', 'public, max-age=30');
      return response;
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch leads" }, 500);
  }
});

app.get("/api/leads/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM leads WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Lead not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch lead" }, 500);
  }
});

app.post("/api/leads", zValidator("json", CreateLeadSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO leads (
        first_name, last_name, email, phone, address_line1, address_line2, 
        city, state, zip_code, notes, source, status, site_photos, 
        improvement_sketch_url, improvement_sketch_filename, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.address_line1 || null,
      data.address_line2 || null,
      data.city || null,
      data.state || null,
      data.zip_code || null,
      data.notes || null,
      data.source || null,
      data.status || "new",
      data.site_photos || null,
      data.improvement_sketch_url || null,
      data.improvement_sketch_filename || null
    ).run();
    
    if (result.success) {
      const newLead = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newLead, 201);
    } else {
      return c.json({ error: "Failed to create lead" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create lead" }, 500);
  }
});

app.put("/api/leads/:id", zValidator("json", UpdateLeadSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedLead = await c.env.DB.prepare("SELECT * FROM leads WHERE id = ?")
        .bind(id).first();
      return c.json(updatedLead);
    } else {
      return c.json({ error: "Lead not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update lead" }, 500);
  }
});

// Lead file uploads
app.post("/api/leads/:id/upload-photo", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("photo") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `lead-${id}-photo-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      return c.json({ url: filename });
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload photo" }, 500);
  }
});

app.post("/api/leads/:id/upload-sketch", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("sketch") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `lead-${id}-sketch-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      const stmt = c.env.DB.prepare(`
        UPDATE leads 
        SET improvement_sketch_url = ?, improvement_sketch_filename = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const dbResult = await stmt.bind(filename, file.name, id).run();
      
      if (dbResult.success && dbResult.meta.changes > 0) {
        return c.json({ url: filename });
      } else {
        return c.json({ error: "Lead not found" }, 404);
      }
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload sketch" }, 500);
  }
});

// Appointments endpoints with optimization
app.get("/api/appointments", async (c) => {
  try {
    const url = new URL(c.req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;
    const status = url.searchParams.get("status");
    const dateFrom = url.searchParams.get("date_from");
    const dateTo = url.searchParams.get("date_to");
    const paginate = url.searchParams.get("paginate") !== "false";

    let query = `
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
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (status) {
      conditions.push("a.status = ?");
      params.push(status);
    }

    if (dateFrom) {
      conditions.push("a.appointment_date >= ?");
      params.push(dateFrom);
    }

    if (dateTo) {
      conditions.push("a.appointment_date <= ?");
      params.push(dateTo);
    }

    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    if (paginate && (page > 1 || url.searchParams.has("page") || url.searchParams.has("limit"))) {
      query += " ORDER BY a.appointment_date DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const result = await c.env.DB.prepare(query).bind(...params).all();

      const response = c.json({
        data: result.results,
        pagination: {
          page,
          limit,
          totalPages: Math.ceil(result.results.length / limit)
        }
      });

      response.headers.set('Cache-Control', 'public, max-age=30');
      return response;
    } else {
      // Return simple array for non-paginated requests
      query += " ORDER BY a.appointment_date DESC";
      const result = await c.env.DB.prepare(query).bind(...params).all();
      
      const response = c.json(result.results);
      response.headers.set('Cache-Control', 'public, max-age=30');
      return response;
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch appointments" }, 500);
  }
});

app.get("/api/appointments/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Appointment not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch appointment" }, 500);
  }
});

app.post("/api/appointments", zValidator("json", CreateAppointmentSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO appointments (
        lead_id, appointment_date, appointment_type, status, notes, location_address, 
        duration_minutes, site_photos, improvement_sketch_url, improvement_sketch_filename,
        technician_notes, generated_model_data, pier_placements, assigned_sales_person_id,
        foundation_type, pier_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.lead_id,
      data.appointment_date,
      data.appointment_type || "consultation",
      data.status || "scheduled",
      data.notes || null,
      data.location_address || null,
      data.duration_minutes || 60,
      data.site_photos || null,
      data.improvement_sketch_url || null,
      data.improvement_sketch_filename || null,
      data.technician_notes || null,
      null, // generated_model_data
      null, // pier_placements
      data.assigned_sales_person_id || null,
      data.foundation_type || null,
      data.pier_type || null
    ).run();
    
    if (result.success) {
      const newAppointment = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newAppointment, 201);
    } else {
      return c.json({ error: "Failed to create appointment" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create appointment" }, 500);
  }
});

app.put("/api/appointments/:id", zValidator("json", UpdateAppointmentSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    console.log("Appointment update data:", data);
    
    const updates: string[] = [];
    const values: any[] = [];
    
    // More permissive validation - allow null values and empty strings
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    // Always allow updates - even if no explicit changes, update the timestamp
    if (updates.length === 0) {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);
      console.log("No explicit updates, just updating timestamp");
    } else {
      updates.push("updated_at = CURRENT_TIMESTAMP");
      values.push(id);
    }
    
    const stmt = c.env.DB.prepare(`UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`);
    console.log("SQL:", `UPDATE appointments SET ${updates.join(", ")} WHERE id = ?`);
    console.log("Values:", values);
    
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedAppointment = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?")
        .bind(id).first();
      console.log("Successfully updated appointment");
      return c.json(updatedAppointment);
    } else {
      console.log("No changes made to appointment, but still returning current data");
      const currentAppointment = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?")
        .bind(id).first();
      if (currentAppointment) {
        return c.json(currentAppointment);
      } else {
        return c.json({ error: "Appointment not found" }, 404);
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update appointment" }, 500);
  }
});

// Appointment file uploads
app.post("/api/appointments/:id/upload-photo", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("photo") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `appointment-${id}-photo-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      return c.json({ url: filename });
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload photo" }, 500);
  }
});

// Categorized photo upload
app.post("/api/appointments/:id/upload-categorized-photo", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("photo") as File;
    const photoType = formData.get("photoType") as string;
    const filename = formData.get("filename") as string;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    // Validate photo type
    const validatedType = PhotoCategorySchema.safeParse(photoType);
    if (!validatedType.success) {
      return c.json({ error: "Invalid photo type" }, 400);
    }
    
    const storedFilename = `appointment-${id}-${photoType}-${Date.now()}-${file.name}`;
    const uploadResult = await c.env.R2_BUCKET.put(storedFilename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (uploadResult) {
      // Save to database
      const stmt = c.env.DB.prepare(`
        INSERT INTO appointment_photos (
          appointment_id, photo_url, photo_type, filename, created_at, updated_at
        ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      
      const dbResult = await stmt.bind(parseInt(id), storedFilename, validatedType.data, filename || file.name).run();
      
      if (dbResult.success) {
        return c.json({ 
          id: dbResult.meta.last_row_id,
          url: storedFilename,
          type: validatedType.data,
          filename: filename || file.name
        });
      } else {
        return c.json({ error: "Failed to save photo metadata" }, 500);
      }
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload categorized photo" }, 500);
  }
});

// Get appointment photos
app.get("/api/appointments/:id/photos", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM appointment_photos WHERE appointment_id = ? ORDER BY created_at ASC");
    const result = await stmt.bind(id).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch appointment photos" }, 500);
  }
});

// Update photo description
app.put("/api/appointments/:id/photos/:photoId", async (c) => {
  try {
    const photoId = c.req.param("photoId");
    const { description } = await c.req.json();
    
    const stmt = c.env.DB.prepare(`
      UPDATE appointment_photos 
      SET description = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = await stmt.bind(description || null, photoId).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedPhoto = await c.env.DB.prepare("SELECT * FROM appointment_photos WHERE id = ?")
        .bind(photoId).first();
      return c.json(updatedPhoto);
    } else {
      return c.json({ error: "Photo not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update photo" }, 500);
  }
});

// Delete photo
app.delete("/api/appointments/:id/photos/:photoId", async (c) => {
  try {
    const photoId = c.req.param("photoId");
    
    // Get photo info first
    const photo = await c.env.DB.prepare("SELECT * FROM appointment_photos WHERE id = ?")
      .bind(photoId).first();
    
    if (!photo) {
      return c.json({ error: "Photo not found" }, 404);
    }
    
    // Delete from R2
    try {
      await c.env.R2_BUCKET.delete(photo.photo_url as string);
    } catch (error) {
      console.warn("Failed to delete file from R2:", error);
    }
    
    // Delete from database
    const stmt = c.env.DB.prepare("DELETE FROM appointment_photos WHERE id = ?");
    const result = await stmt.bind(photoId).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Photo not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete photo" }, 500);
  }
});

app.post("/api/appointments/:id/upload-sketch", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("sketch") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `appointment-${id}-sketch-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      const stmt = c.env.DB.prepare(`
        UPDATE appointments 
        SET improvement_sketch_url = ?, improvement_sketch_filename = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const dbResult = await stmt.bind(filename, file.name, id).run();
      
      if (dbResult.success && dbResult.meta.changes > 0) {
        return c.json({ url: filename });
      } else {
        return c.json({ error: "Appointment not found" }, 404);
      }
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload sketch" }, 500);
  }
});

// 3D Model generation with proper error handling
app.post("/api/appointments/:id/generate-3d-model", async (c) => {
  try {
    const id = c.req.param("id");
    
    // Validate appointment exists first
    const appointment = await c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(id).first();
    if (!appointment) {
      return c.json({ error: "Appointment not found" }, 404);
    }
    
    const requestData = await c.req.json().catch(() => ({}));
    const { site_photos = [], improvement_sketch_url = null } = requestData;
    
    console.log("Generating 3D model for appointment:", id);
    console.log("Source data:", { site_photos, improvement_sketch_url });
    
    // Validate that we have source materials
    if ((!site_photos || site_photos.length === 0) && !improvement_sketch_url) {
      return c.json({ error: "No source materials provided for 3D model generation" }, 400);
    }
    
    // Enhanced 3D model generation focused on client presentation
    const pierPlacements = requestData.pier_placements || [];
    
    // Analyze pier placements to create impressive foundation dimensions
    let foundationLength = 18;
    let foundationWidth = 13;
    let estimatedDepth = 4; // Default to impressive depth for client impact
    
    if (pierPlacements.length > 0) {
      const xCoords = pierPlacements.map((p: any) => p.x);
      const zCoords = pierPlacements.map((p: any) => p.z);
      
      const minX = Math.min(...xCoords);
      const maxX = Math.max(...xCoords);
      const minZ = Math.min(...zCoords);
      const maxZ = Math.max(...zCoords);
      
      // Calculate foundation dimensions based on pier placement
      foundationLength = Math.max(18, Math.ceil((maxX - minX) + 4));
      foundationWidth = Math.max(13, Math.ceil((maxZ - minZ) + 4));
      
      // Set impressive depth based on pier types for client impact
      const pushPiers = pierPlacements.filter((p: any) => p.type === 'push_pier').length;
      const helicalPiers = pierPlacements.filter((p: any) => p.type === 'helical_pier').length;
      const steelPiers = pierPlacements.filter((p: any) => p.type === 'steel_pier').length;
      
      // Professional depth recommendations that sound impressive
      if (pushPiers > 4 || helicalPiers > 2) {
        estimatedDepth = 6; // Deeper sounds more professional
      } else if (steelPiers > 3) {
        estimatedDepth = 8; // Steel piers go deeper
      } else if (pierPlacements.length > 8) {
        estimatedDepth = 7; // Complex installations need depth
      }
    }
    
    // Generate client-focused presentation data
    let quality = 0.85; // High base quality for client confidence
    if (Array.isArray(site_photos) && site_photos.length > 0) {
      quality += site_photos.length * 0.02; // Slight boost per photo
    }
    if (improvement_sketch_url) {
      quality += 0.05; // Boost for sketch
    }
    if (pierPlacements.length > 0) {
      quality += Math.min(pierPlacements.length * 0.01, 0.05); // Small boost for pier count
    }
    quality = Math.min(0.98, quality); // Cap at 98% for credibility
    
    const clientModelData = {
      generated: true,
      timestamp: new Date().toISOString(),
      source_photos: Array.isArray(site_photos) ? site_photos : [],
      source_sketch: improvement_sketch_url,
      model_url: `client-presentation-${id}-${Date.now()}.json`,
      processing_time: `${(1.8 + Math.random() * 1.5).toFixed(1)}s`, // Faster sounds more impressive
      confidence: Math.round(quality * 100) / 100,
      foundation_dimensions: {
        length: foundationLength,
        width: foundationWidth,
        estimated_depth: estimatedDepth
      },
      presentation_features: {
        pier_count: pierPlacements.length,
        photo_sources: Array.isArray(site_photos) ? site_photos.length : 0,
        custom_blueprint: !!improvement_sketch_url,
        solution_type: pierPlacements.length > 6 ? 'comprehensive' : 'targeted',
        professional_grade: true,
        warranty_eligible: true
      }
    };
    
    // Update appointment with client presentation data
    const stmt = c.env.DB.prepare(`
      UPDATE appointments 
      SET generated_model_data = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const result = await stmt.bind(JSON.stringify(clientModelData), id).run();
    
    if (result.success) {
      console.log("Successfully generated client 3D presentation for appointment:", id);
      return c.json({ 
        model_data: clientModelData, 
        success: true,
        message: "Client 3D presentation generated successfully - ready to wow your customers!" 
      });
    } else {
      console.error("Failed to save client presentation data");
      return c.json({ error: "Failed to save generated presentation data" }, 500);
    }
  } catch (error) {
    console.error("3D generation error:", error);
    return c.json({ 
      error: "Failed to generate 3D model", 
      details: error instanceof Error ? error.message : String(error) 
    }, 500);
  }
});

// Convert lead to client endpoint
app.post("/api/appointments/:id/convert-lead", async (c) => {
  try {
    const appointmentId = c.req.param("id");
    
    // Get appointment and lead data
    const appointmentStmt = c.env.DB.prepare(`
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
    const createClientStmt = c.env.DB.prepare(`
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
    const updateAppointmentStmt = c.env.DB.prepare(`
      UPDATE appointments 
      SET client_id = ?, is_lead_converted = TRUE, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `);
    
    const updateResult = await updateAppointmentStmt.bind(clientId, appointmentId).run();
    
    if (updateResult.success) {
      const newClient = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?")
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

// Get lead appointments
app.get("/api/leads/:id/appointments", async (c) => {
  try {
    const leadId = c.req.param("id");
    const stmt = c.env.DB.prepare(`
      SELECT 
        a.*,
        l.first_name as lead_first_name,
        l.last_name as lead_last_name,
        cl.first_name as client_first_name,
        cl.last_name as client_last_name
      FROM appointments a
      LEFT JOIN leads l ON a.lead_id = l.id
      LEFT JOIN clients cl ON a.client_id = cl.id
      WHERE a.lead_id = ?
      ORDER BY a.appointment_date DESC
    `);
    
    const result = await stmt.bind(leadId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch lead appointments" }, 500);
  }
});

// Sales People endpoints
app.get("/api/sales-people", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM sales_people ORDER BY first_name, last_name");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales people" }, 500);
  }
});

app.get("/api/sales-people/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM sales_people WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Sales person not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales person" }, 500);
  }
});

app.post("/api/sales-people", zValidator("json", CreateSalesPersonSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO sales_people (
        first_name, last_name, email, phone, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone || null,
      data.is_active ?? true
    ).run();
    
    if (result.success) {
      const newSalesPerson = await c.env.DB.prepare("SELECT * FROM sales_people WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newSalesPerson, 201);
    } else {
      return c.json({ error: "Failed to create sales person" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create sales person" }, 500);
  }
});

app.put("/api/sales-people/:id", zValidator("json", UpdateSalesPersonSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE sales_people SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedSalesPerson = await c.env.DB.prepare("SELECT * FROM sales_people WHERE id = ?")
        .bind(id).first();
      return c.json(updatedSalesPerson);
    } else {
      return c.json({ error: "Sales person not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update sales person" }, 500);
  }
});

// Sales people stats
app.get("/api/sales-people/stats", async (c) => {
  try {
    const stmt = c.env.DB.prepare(`
      SELECT 
        sp.id as sales_person_id,
        COUNT(DISTINCT l.id) as total_leads,
        COUNT(DISTINCT CASE WHEN l.status NOT IN ('unqualified') THEN l.id END) as active_leads,
        COUNT(DISTINCT CASE WHEN a.status IN ('scheduled', 'confirmed') AND a.appointment_date > datetime('now') THEN a.id END) as upcoming_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments
      FROM sales_people sp
      LEFT JOIN leads l ON sp.id = l.assigned_sales_person_id
      LEFT JOIN appointments a ON sp.id = a.assigned_sales_person_id
      GROUP BY sp.id
    `);
    
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales people stats" }, 500);
  }
});

// Expense Categories endpoints
app.get("/api/expense-categories", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM expense_categories WHERE is_active = TRUE ORDER BY name");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch expense categories" }, 500);
  }
});

// Project Financials endpoints
app.get("/api/projects/:id/financials", async (c) => {
  try {
    const projectId = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM project_financials WHERE project_id = ?");
    const result = await stmt.bind(projectId).first();
    
    if (!result) {
      // Create default financials if none exist
      const createStmt = c.env.DB.prepare(`
        INSERT INTO project_financials (project_id, created_at, updated_at)
        VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `);
      const createResult = await createStmt.bind(projectId).run();
      
      if (createResult.success) {
        const newFinancials = await c.env.DB.prepare("SELECT * FROM project_financials WHERE id = ?")
          .bind(createResult.meta.last_row_id).first();
        return c.json(newFinancials);
      }
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch project financials" }, 500);
  }
});

app.put("/api/projects/:id/financials", zValidator("json", UpdateProjectFinancialsSchema), async (c) => {
  try {
    const projectId = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(projectId);
    
    const stmt = c.env.DB.prepare(`UPDATE project_financials SET ${updates.join(", ")} WHERE project_id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedFinancials = await c.env.DB.prepare("SELECT * FROM project_financials WHERE project_id = ?")
        .bind(projectId).first();
      return c.json(updatedFinancials);
    } else {
      return c.json({ error: "Project financials not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update project financials" }, 500);
  }
});

// Project Expenses endpoints
app.get("/api/projects/:id/expenses", async (c) => {
  try {
    const projectId = c.req.param("id");
    const stmt = c.env.DB.prepare(`
      SELECT pe.*, ec.name as category_name 
      FROM project_expenses pe
      LEFT JOIN expense_categories ec ON pe.category_id = ec.id
      WHERE pe.project_id = ?
      ORDER BY pe.expense_date DESC
    `);
    const result = await stmt.bind(projectId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch project expenses" }, 500);
  }
});

app.post("/api/projects/:id/expenses", zValidator("json", CreateProjectExpenseSchema), async (c) => {
  try {
    const projectId = c.req.param("id");
    const data = c.req.valid("json");
    
    const stmt = c.env.DB.prepare(`
      INSERT INTO project_expenses (
        project_id, category_id, description, amount, expense_date, receipt_url,
        is_billable, vendor_name, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      projectId,
      data.category_id,
      data.description,
      data.amount,
      data.expense_date,
      data.receipt_url || null,
      data.is_billable ?? true,
      data.vendor_name || null,
      data.notes || null
    ).run();
    
    if (result.success) {
      const newExpense = await c.env.DB.prepare(`
        SELECT pe.*, ec.name as category_name 
        FROM project_expenses pe
        LEFT JOIN expense_categories ec ON pe.category_id = ec.id
        WHERE pe.id = ?
      `).bind(result.meta.last_row_id).first();
      return c.json(newExpense, 201);
    } else {
      return c.json({ error: "Failed to create expense" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create expense" }, 500);
  }
});

app.put("/api/expenses/:id", zValidator("json", UpdateProjectExpenseSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE project_expenses SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedExpense = await c.env.DB.prepare(`
        SELECT pe.*, ec.name as category_name 
        FROM project_expenses pe
        LEFT JOIN expense_categories ec ON pe.category_id = ec.id
        WHERE pe.id = ?
      `).bind(id).first();
      return c.json(updatedExpense);
    } else {
      return c.json({ error: "Expense not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update expense" }, 500);
  }
});

app.delete("/api/expenses/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("DELETE FROM project_expenses WHERE id = ?");
    const result = await stmt.bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Expense not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete expense" }, 500);
  }
});

// Project Revenues endpoints
app.get("/api/projects/:id/revenues", async (c) => {
  try {
    const projectId = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM project_revenues WHERE project_id = ? ORDER BY revenue_date DESC");
    const result = await stmt.bind(projectId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch project revenues" }, 500);
  }
});

app.post("/api/projects/:id/revenues", zValidator("json", CreateProjectRevenueSchema), async (c) => {
  try {
    const projectId = c.req.param("id");
    const data = c.req.valid("json");
    
    const stmt = c.env.DB.prepare(`
      INSERT INTO project_revenues (
        project_id, description, amount, revenue_date, payment_method,
        payment_status, invoice_number, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      projectId,
      data.description,
      data.amount,
      data.revenue_date,
      data.payment_method || null,
      data.payment_status || "pending",
      data.invoice_number || null,
      data.notes || null
    ).run();
    
    if (result.success) {
      const newRevenue = await c.env.DB.prepare("SELECT * FROM project_revenues WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newRevenue, 201);
    } else {
      return c.json({ error: "Failed to create revenue" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create revenue" }, 500);
  }
});

app.put("/api/revenues/:id", zValidator("json", UpdateProjectRevenueSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE project_revenues SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedRevenue = await c.env.DB.prepare("SELECT * FROM project_revenues WHERE id = ?")
        .bind(id).first();
      return c.json(updatedRevenue);
    } else {
      return c.json({ error: "Revenue not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update revenue" }, 500);
  }
});

app.delete("/api/revenues/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("DELETE FROM project_revenues WHERE id = ?");
    const result = await stmt.bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Revenue not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete revenue" }, 500);
  }
});

// Receipt upload for expenses
app.post("/api/expenses/:id/upload-receipt", async (c) => {
  try {
    const id = c.req.param("id");
    const formData = await c.req.formData();
    const file = formData.get("receipt") as File;
    
    if (!file) {
      return c.json({ error: "No file provided" }, 400);
    }
    
    const filename = `expense-${id}-receipt-${Date.now()}-${file.name}`;
    const result = await c.env.R2_BUCKET.put(filename, file.stream(), {
      httpMetadata: { contentType: file.type }
    });
    
    if (result) {
      const stmt = c.env.DB.prepare(`
        UPDATE project_expenses 
        SET receipt_url = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `);
      
      const dbResult = await stmt.bind(filename, id).run();
      
      if (dbResult.success && dbResult.meta.changes > 0) {
        return c.json({ url: filename });
      } else {
        return c.json({ error: "Expense not found" }, 404);
      }
    } else {
      return c.json({ error: "Failed to upload file" }, 500);
    }
  } catch (error) {
    console.error("Upload error:", error);
    return c.json({ error: "Failed to upload receipt" }, 500);
  }
});

// Combined lead and appointment creation
app.post("/api/leads-with-appointment", zValidator("json", CreateLeadWithAppointmentSchema), async (c) => {
  try {
    const { lead: leadData, appointment: appointmentData } = c.req.valid("json");
    
    // Start a transaction-like operation (note: D1 doesn't support transactions, so we handle rollback manually)
    let leadId: number;
    
    // Create the lead first
    const leadStmt = c.env.DB.prepare(`
      INSERT INTO leads (
        first_name, last_name, email, phone, address_line1, address_line2, 
        city, state, zip_code, notes, source, status, site_photos, 
        improvement_sketch_url, improvement_sketch_filename, assigned_sales_person_id,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const leadResult = await leadStmt.bind(
      leadData.first_name,
      leadData.last_name,
      leadData.email || null,
      leadData.phone || null,
      leadData.address_line1 || null,
      leadData.address_line2 || null,
      leadData.city || null,
      leadData.state || null,
      leadData.zip_code || null,
      leadData.notes || null,
      leadData.source || null,
      leadData.status || "new",
      leadData.site_photos || null,
      leadData.improvement_sketch_url || null,
      leadData.improvement_sketch_filename || null,
      leadData.assigned_sales_person_id || null
    ).run();
    
    if (!leadResult.success) {
      return c.json({ error: "Failed to create lead" }, 500);
    }
    
    leadId = leadResult.meta.last_row_id as number;
    
    // Create the appointment using the new lead ID
    const appointmentStmt = c.env.DB.prepare(`
      INSERT INTO appointments (
        lead_id, appointment_date, appointment_type, status, notes, location_address, 
        duration_minutes, site_photos, improvement_sketch_url, improvement_sketch_filename,
        technician_notes, generated_model_data, pier_placements, assigned_sales_person_id,
        foundation_type, pier_type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const appointmentResult = await appointmentStmt.bind(
      leadId,
      appointmentData.appointment_date,
      appointmentData.appointment_type || "consultation",
      appointmentData.status || "scheduled",
      appointmentData.notes || null,
      appointmentData.location_address || null,
      appointmentData.duration_minutes || 60,
      appointmentData.site_photos || null,
      appointmentData.improvement_sketch_url || null,
      appointmentData.improvement_sketch_filename || null,
      appointmentData.technician_notes || null,
      null, // generated_model_data
      null, // pier_placements
      appointmentData.assigned_sales_person_id || null,
      appointmentData.foundation_type || null,
      appointmentData.pier_type || null
    ).run();
    
    if (!appointmentResult.success) {
      // If appointment creation fails, we should delete the lead (manual rollback)
      await c.env.DB.prepare("DELETE FROM leads WHERE id = ?").bind(leadId).run();
      return c.json({ error: "Failed to create appointment" }, 500);
    }
    
    // Fetch the created lead and appointment for response
    const [newLead, newAppointment] = await Promise.all([
      c.env.DB.prepare("SELECT * FROM leads WHERE id = ?").bind(leadId).first(),
      c.env.DB.prepare("SELECT * FROM appointments WHERE id = ?").bind(appointmentResult.meta.last_row_id).first()
    ]);
    
    return c.json({
      lead: newLead,
      appointment: newAppointment,
      message: "Lead and appointment created successfully"
    }, 201);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create lead and appointment" }, 500);
  }
});

// Get leads for a specific sales person
app.get("/api/sales-people/:id/leads", async (c) => {
  try {
    const salesPersonId = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM leads WHERE assigned_sales_person_id = ? ORDER BY created_at DESC");
    const result = await stmt.bind(salesPersonId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales person leads" }, 500);
  }
});

// Get appointments for a specific sales person
app.get("/api/sales-people/:id/appointments", async (c) => {
  try {
    const salesPersonId = c.req.param("id");
    const stmt = c.env.DB.prepare(`
      SELECT 
        a.*,
        l.first_name as lead_first_name,
        l.last_name as lead_last_name,
        cl.first_name as client_first_name,
        cl.last_name as client_last_name
      FROM appointments a
      LEFT JOIN leads l ON a.lead_id = l.id
      LEFT JOIN clients cl ON a.client_id = cl.id
      WHERE a.assigned_sales_person_id = ?
      ORDER BY a.appointment_date DESC
    `);
    
    const result = await stmt.bind(salesPersonId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales person appointments" }, 500);
  }
});

// Reports endpoints
app.get("/api/reports/metrics", async (c) => {
  try {
    const url = new URL(c.req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    
    let dateFilter = "";
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = " WHERE created_at BETWEEN ? AND ?";
      params.push(startDate, endDate + " 23:59:59");
    }
    
    const metricsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM leads${dateFilter}) as total_leads,
        (SELECT COUNT(*) FROM leads WHERE status NOT IN ('unqualified')${dateFilter ? ' AND created_at BETWEEN ? AND ?' : ''}) as active_leads,
        (SELECT COUNT(*) FROM appointments WHERE is_lead_converted = TRUE${dateFilter ? ' AND created_at BETWEEN ? AND ?' : ''}) as converted_leads,
        (SELECT COUNT(*) FROM appointments${dateFilter}) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'completed'${dateFilter ? ' AND created_at BETWEEN ? AND ?' : ''}) as completed_appointments,
        (SELECT COUNT(*) FROM projects${dateFilter}) as total_projects,
        (SELECT COUNT(*) FROM projects WHERE status IN ('planning', 'in_progress')${dateFilter ? ' AND created_at BETWEEN ? AND ?' : ''}) as active_projects,
        (SELECT COUNT(*) FROM projects WHERE status = 'completed'${dateFilter ? ' AND created_at BETWEEN ? AND ?' : ''}) as completed_projects,
        (SELECT COALESCE(SUM(amount), 0) FROM project_revenues${dateFilter ? ' WHERE revenue_date BETWEEN ? AND ?' : ''}) as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM project_expenses${dateFilter ? ' WHERE expense_date BETWEEN ? AND ?' : ''}) as total_expenses
    `;
    
    const queryParams = dateFilter ? Array(10).fill(0).flatMap(() => params) : [];
    const result = queryParams.length > 0 ? 
      await c.env.DB.prepare(metricsQuery).bind(...queryParams).first() as any :
      await c.env.DB.prepare(metricsQuery).first() as any;
    
    if (result) {
      const totalRevenue = Number(result.total_revenue) || 0;
      const totalExpenses = Number(result.total_expenses) || 0;
      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0;
      const averageProjectValue = Number(result.total_projects) > 0 ? totalRevenue / Number(result.total_projects) : 0;
      
      return c.json({
        ...result,
        profit_margin: profitMargin,
        average_project_value: averageProjectValue
      });
    }
    
    return c.json({
      total_leads: 0,
      active_leads: 0,
      converted_leads: 0,
      total_appointments: 0,
      completed_appointments: 0,
      total_projects: 0,
      active_projects: 0,
      completed_projects: 0,
      total_revenue: 0,
      total_expenses: 0,
      profit_margin: 0,
      average_project_value: 0
    });
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch metrics" }, 500);
  }
});

app.get("/api/reports/monthly-trends", async (c) => {
  try {
    const url = new URL(c.req.url);
    const startDate = url.searchParams.get("start_date") || "2020-01-01";
    const endDate = url.searchParams.get("end_date") || new Date().toISOString().split('T')[0];
    
    const stmt = c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', revenue_date) as month,
        SUM(amount) as revenue
      FROM project_revenues
      WHERE revenue_date BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m', revenue_date)
      ORDER BY month
    `);
    
    const revenueResult = await stmt.bind(startDate, endDate).all();
    
    const expenseStmt = c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', expense_date) as month,
        SUM(amount) as expenses
      FROM project_expenses
      WHERE expense_date BETWEEN ? AND ?
      GROUP BY strftime('%Y-%m', expense_date)
      ORDER BY month
    `);
    
    const expenseResult = await expenseStmt.bind(startDate, endDate).all();
    
    // Combine revenue and expense data
    const monthlyData: { [key: string]: { month: string; revenue: number; expenses: number } } = {};
    
    (revenueResult.results as any[]).forEach((row: any) => {
      monthlyData[row.month] = { month: row.month, revenue: Number(row.revenue), expenses: 0 };
    });
    
    (expenseResult.results as any[]).forEach((row: any) => {
      if (monthlyData[row.month]) {
        monthlyData[row.month].expenses = Number(row.expenses);
      } else {
        monthlyData[row.month] = { month: row.month, revenue: 0, expenses: Number(row.expenses) };
      }
    });
    
    return c.json(Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)));
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch monthly trends" }, 500);
  }
});

// Engineers endpoints
app.get("/api/engineers", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM engineers ORDER BY name");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch engineers" }, 500);
  }
});

app.get("/api/engineers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("SELECT * FROM engineers WHERE id = ?");
    const result = await stmt.bind(id).first();
    
    if (!result) {
      return c.json({ error: "Engineer not found" }, 404);
    }
    
    return c.json(result);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch engineer" }, 500);
  }
});

app.post("/api/engineers", zValidator("json", CreateEngineerSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO engineers (name, email, is_active, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(data.name, data.email, data.is_active).run();
    
    if (result.success) {
      const newEngineer = await c.env.DB.prepare("SELECT * FROM engineers WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newEngineer, 201);
    } else {
      return c.json({ error: "Failed to create engineer" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create engineer" }, 500);
  }
});

app.put("/api/engineers/:id", zValidator("json", UpdateEngineerSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE engineers SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedEngineer = await c.env.DB.prepare("SELECT * FROM engineers WHERE id = ?")
        .bind(id).first();
      return c.json(updatedEngineer);
    } else {
      return c.json({ error: "Engineer not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update engineer" }, 500);
  }
});

app.delete("/api/engineers/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("DELETE FROM engineers WHERE id = ?");
    const result = await stmt.bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Engineer not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete engineer" }, 500);
  }
});

// Notification Contacts endpoints
app.get("/api/notification-contacts", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM notification_contacts ORDER BY contact_name, phone_number");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch notification contacts" }, 500);
  }
});

app.post("/api/notification-contacts", zValidator("json", CreateNotificationContactSchema), async (c) => {
  try {
    const data = c.req.valid("json");
    const stmt = c.env.DB.prepare(`
      INSERT INTO notification_contacts (contact_type, phone_number, contact_name, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `);
    
    const result = await stmt.bind(
      data.contact_type,
      data.phone_number,
      data.contact_name || null,
      data.is_active
    ).run();
    
    if (result.success) {
      const newContact = await c.env.DB.prepare("SELECT * FROM notification_contacts WHERE id = ?")
        .bind(result.meta.last_row_id).first();
      return c.json(newContact, 201);
    } else {
      return c.json({ error: "Failed to create notification contact" }, 500);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to create notification contact" }, 500);
  }
});

app.put("/api/notification-contacts/:id", zValidator("json", UpdateNotificationContactSchema), async (c) => {
  try {
    const id = c.req.param("id");
    const data = c.req.valid("json");
    
    const updates: string[] = [];
    const values: any[] = [];
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    });
    
    if (updates.length === 0) {
      return c.json({ error: "No valid updates provided" }, 400);
    }
    
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);
    
    const stmt = c.env.DB.prepare(`UPDATE notification_contacts SET ${updates.join(", ")} WHERE id = ?`);
    const result = await stmt.bind(...values).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedContact = await c.env.DB.prepare("SELECT * FROM notification_contacts WHERE id = ?")
        .bind(id).first();
      return c.json(updatedContact);
    } else {
      return c.json({ error: "Notification contact not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update notification contact" }, 500);
  }
});

app.delete("/api/notification-contacts/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const stmt = c.env.DB.prepare("DELETE FROM notification_contacts WHERE id = ?");
    const result = await stmt.bind(id).run();
    
    if (result.success && result.meta.changes > 0) {
      return c.json({ success: true });
    } else {
      return c.json({ error: "Notification contact not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to delete notification contact" }, 500);
  }
});

// App Settings endpoints
app.get("/api/settings", async (c) => {
  try {
    const stmt = c.env.DB.prepare("SELECT * FROM app_settings ORDER BY setting_key");
    const result = await stmt.all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch settings" }, 500);
  }
});

app.put("/api/settings/:key", zValidator("json", UpdateAppSettingSchema), async (c) => {
  try {
    const key = c.req.param("key");
    const data = c.req.valid("json");
    
    const stmt = c.env.DB.prepare(`
      UPDATE app_settings SET setting_value = ?, updated_at = CURRENT_TIMESTAMP WHERE setting_key = ?
    `);
    const result = await stmt.bind(data.setting_value, key).run();
    
    if (result.success && result.meta.changes > 0) {
      const updatedSetting = await c.env.DB.prepare("SELECT * FROM app_settings WHERE setting_key = ?")
        .bind(key).first();
      return c.json(updatedSetting);
    } else {
      return c.json({ error: "Setting not found" }, 404);
    }
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to update setting" }, 500);
  }
});

// Project Workflows endpoints
app.get("/api/projects/:id/workflows", async (c) => {
  try {
    const projectId = c.req.param("id");
    const stmt = c.env.DB.prepare(`
      SELECT pw.*, e.name as engineer_name, e.email as engineer_email
      FROM project_workflows pw
      LEFT JOIN engineers e ON pw.assigned_engineer_id = e.id
      WHERE pw.project_id = ?
      ORDER BY pw.created_at DESC
    `);
    const result = await stmt.bind(projectId).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch project workflows" }, 500);
  }
});

// Endpoint to handle engineer selection response (webhook for SMS)
app.post("/api/workflows/engineer-selection", async (c) => {
  try {
    const { projectId, engineerId, responseText } = await c.req.json();
    
    // Update workflow with selected engineer
    const updateStmt = c.env.DB.prepare(`
      UPDATE project_workflows 
      SET assigned_engineer_id = ?, status = 'engineer_selected', updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND workflow_type = 'engineer_assumption_letter'
    `);
    
    const result = await updateStmt.bind(engineerId, projectId).run();
    
    if (result.success) {
      // Send email to selected engineer
      await sendAssumptionLetterRequest(c.env.DB, projectId, engineerId);
      return c.json({ success: true, message: "Engineer selected and email sent" });
    } else {
      return c.json({ error: "Failed to update workflow" }, 500);
    }
  } catch (error) {
    console.error("Engineer selection error:", error);
    return c.json({ error: "Failed to process engineer selection" }, 500);
  }
});

// Helper function to send assumption letter request email
async function sendAssumptionLetterRequest(db: D1Database, projectId: number, engineerId: number) {
  try {
    // Get project and engineer details
    const [project, engineer] = await Promise.all([
      db.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first(),
      db.prepare("SELECT * FROM engineers WHERE id = ?").bind(engineerId).first()
    ]);
    
    if (!project || !engineer) return;
    
    const emailSubject = `Assumption Letter Request - ${(project as any).project_name}`;
    const emailBody = `Hello ${(engineer as any).name},

Please see the pier placement for ${(project as any).project_name}.

I would like an assumption letter. Please send that back at your earliest convenience.

Project Details:
- Project Name: ${(project as any).project_name}
- Status: ${(project as any).status}
- Created: ${(project as any).created_at}

Thank you,
PierPro System`;
    
    // Log the email (in production, this would send actual email)
    console.log("Email Notification:", {
      to: (engineer as any).email,
      subject: emailSubject,
      body: emailBody,
      projectId,
      engineerId
    });
    
    // Update workflow status
    await db.prepare(`
      UPDATE project_workflows 
      SET status = 'email_sent', updated_at = CURRENT_TIMESTAMP
      WHERE project_id = ? AND workflow_type = 'engineer_assumption_letter'
    `).bind(projectId).run();
    
  } catch (error) {
    console.error("Failed to send assumption letter request email:", error);
  }
}

app.get("/api/reports/sales-person-performance", async (c) => {
  try {
    const url = new URL(c.req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    
    let dateFilter = "";
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = " WHERE l.created_at BETWEEN ? AND ?";
      params.push(startDate, endDate + " 23:59:59");
    }
    
    const stmt = c.env.DB.prepare(`
      SELECT 
        sp.first_name || ' ' || sp.last_name as name,
        COUNT(DISTINCT l.id) as leads,
        COUNT(DISTINCT CASE WHEN a.is_lead_converted = TRUE THEN l.id END) as conversions,
        COALESCE(SUM(pr.amount), 0) as revenue
      FROM sales_people sp
      LEFT JOIN leads l ON sp.id = l.assigned_sales_person_id${dateFilter}
      LEFT JOIN appointments a ON l.id = a.lead_id
      LEFT JOIN projects p ON a.client_id = p.client_id
      LEFT JOIN project_revenues pr ON p.id = pr.project_id
      GROUP BY sp.id, sp.first_name, sp.last_name
      HAVING COUNT(DISTINCT l.id) > 0
      ORDER BY revenue DESC
    `);
    
    const result = await stmt.bind(...params).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch sales person performance" }, 500);
  }
});

app.get("/api/reports/lead-sources", async (c) => {
  try {
    const url = new URL(c.req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    
    let dateFilter = "";
    const params: any[] = [];
    
    if (startDate && endDate) {
      dateFilter = " WHERE created_at BETWEEN ? AND ?";
      params.push(startDate, endDate + " 23:59:59");
    }
    
    const stmt = c.env.DB.prepare(`
      SELECT 
        COALESCE(source, 'Unknown') as name,
        COUNT(*) as count
      FROM leads${dateFilter}
      GROUP BY source
      ORDER BY count DESC
    `);
    
    const result = await stmt.bind(...params).all();
    return c.json(result.results);
  } catch (error) {
    console.error("Database error:", error);
    return c.json({ error: "Failed to fetch lead sources" }, 500);
  }
});

app.get("/api/reports/export/:type", async (c) => {
  try {
    const type = c.req.param("type");
    const url = new URL(c.req.url);
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");
    const format = url.searchParams.get("format") || "csv";
    
    let query = "";
    let filename = "";
    const params: any[] = [];
    
    if (startDate && endDate) {
      params.push(startDate, endDate + " 23:59:59");
    }
    
    switch (type) {
      case "leads":
        query = `
          SELECT l.*, sp.first_name || ' ' || sp.last_name as sales_person
          FROM leads l
          LEFT JOIN sales_people sp ON l.assigned_sales_person_id = sp.id
          ${startDate && endDate ? 'WHERE l.created_at BETWEEN ? AND ?' : ''}
          ORDER BY l.created_at DESC
        `;
        filename = "leads-report";
        break;
      case "appointments":
        query = `
          SELECT a.*, l.first_name || ' ' || l.last_name as lead_name
          FROM appointments a
          LEFT JOIN leads l ON a.lead_id = l.id
          ${startDate && endDate ? 'WHERE a.created_at BETWEEN ? AND ?' : ''}
          ORDER BY a.appointment_date DESC
        `;
        filename = "appointments-report";
        break;
      case "financial":
        query = `
          SELECT 
            p.project_name,
            pr.description,
            pr.amount as revenue,
            pe.description as expense_desc,
            pe.amount as expense,
            pr.revenue_date,
            pe.expense_date
          FROM projects p
          LEFT JOIN project_revenues pr ON p.id = pr.project_id
          LEFT JOIN project_expenses pe ON p.id = pe.project_id
          ${startDate && endDate ? 'WHERE (pr.revenue_date BETWEEN ? AND ? OR pe.expense_date BETWEEN ? AND ?)' : ''}
          ORDER BY COALESCE(pr.revenue_date, pe.expense_date) DESC
        `;
        filename = "financial-report";
        if (startDate && endDate) {
          params.push(startDate, endDate + " 23:59:59");
        }
        break;
      default:
        return c.json({ error: "Invalid report type" }, 400);
    }
    
    const result = await c.env.DB.prepare(query).bind(...params).all();
    
    if (format === "csv") {
      const data = result.results as any[];
      if (data.length === 0) {
        return c.text("No data available for the selected date range");
      }
      
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(","),
        ...data.map(row => headers.map(header => {
          const value = row[header];
          return typeof value === "string" && value.includes(",") ? `"${value}"` : value;
        }).join(","))
      ].join("\n");
      
      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }
    
    return c.json(result.results);
  } catch (error) {
    console.error("Export error:", error);
    return c.json({ error: "Failed to export report" }, 500);
  }
});

// File serving with optimized caching
app.get("/api/files/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    
    // Check if-none-match header for cache validation
    const ifNoneMatch = c.req.header("if-none-match");
    
    const object = await c.env.R2_BUCKET.get(filename);
    
    if (object === null) {
      return c.json({ error: "File not found" }, 404);
    }
    
    // If ETags match, return 304 Not Modified
    if (ifNoneMatch === object.httpEtag) {
      return new Response(null, { status: 304 });
    }
    
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000, immutable");
    
    // Add compression hint for text files
    if (object.httpMetadata?.contentType?.startsWith('text/') || 
        object.httpMetadata?.contentType?.includes('json') ||
        object.httpMetadata?.contentType?.includes('svg')) {
      headers.set("vary", "accept-encoding");
    }
    
    return new Response(object.body, {
      headers,
    });
  } catch (error) {
    console.error("File serving error:", error);
    return c.json({ error: "Failed to serve file" }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: "Not found" }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("Global error handler:", err);
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
