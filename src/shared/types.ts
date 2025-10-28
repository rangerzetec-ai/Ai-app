import z from "zod";

// Client schema
export const CreateClientSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateClientSchema = CreateClientSchema.partial();

export const ClientSchema = CreateClientSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Project schema  
export const CreateProjectSchema = z.object({
  client_id: z.number(),
  project_name: z.string().min(1, "Project name is required"),
  description: z.string().optional(),
  status: z.enum(["planning", "in_progress", "completed", "cancelled"]).default("planning"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().omit({ client_id: true });

export const ProjectSchema = CreateProjectSchema.extend({
  id: z.number(),
  improvement_sketch_url: z.string().nullable(),
  improvement_sketch_filename: z.string().nullable(),
  model_data: z.string().nullable(),
  pier_placements: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Pier placement schema
export const PierPlacementSchema = z.object({
  id: z.string(),
  x: z.number(),
  y: z.number(),
  z: z.number(),
  type: z.enum(["push_pier", "helical_pier", "steel_pier"]),
  elevation: z.number().optional(),
  notes: z.string().optional(),
});

export const PierPlacementsSchema = z.array(PierPlacementSchema);

// API response schemas
export const ApiErrorSchema = z.object({
  error: z.string(),
});

// Lead schema
export const CreateLeadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address_line1: z.string().optional(),
  address_line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(),
  notes: z.string().optional(),
  source: z.string().optional(),
  status: z.enum(["new", "contacted", "qualified", "unqualified"]).default("new"),
  site_photos: z.string().optional(),
  improvement_sketch_url: z.string().optional(),
  improvement_sketch_filename: z.string().optional(),
  assigned_sales_person_id: z.number().optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial();

export const LeadSchema = CreateLeadSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Appointment schema
export const CreateAppointmentSchema = z.object({
  lead_id: z.number(),
  appointment_date: z.string(),
  appointment_type: z.enum(["consultation", "estimate", "inspection", "follow_up"]).default("consultation"),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled"),
  notes: z.string().optional(),
  location_address: z.string().optional(),
  duration_minutes: z.number().default(60),
  site_photos: z.string().optional(),
  improvement_sketch_url: z.string().optional(),
  improvement_sketch_filename: z.string().optional(),
  technician_notes: z.string().optional(),
  assigned_sales_person_id: z.number().optional(),
  foundation_type: z.enum(["slab", "pier_and_beam"]).optional(),
  pier_type: z.enum(["poured", "blocks", "posts"]).optional(),
});

export const UpdateAppointmentSchema = CreateAppointmentSchema.partial();

export const AppointmentSchema = CreateAppointmentSchema.extend({
  id: z.number(),
  client_id: z.number().nullable(),
  is_lead_converted: z.boolean().default(false),
  generated_model_data: z.string().nullable(),
  pier_placements: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Sales Person schema
export const CreateSalesPersonSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateSalesPersonSchema = CreateSalesPersonSchema.partial();

export const SalesPersonSchema = CreateSalesPersonSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Combined Lead and Appointment schema
export const CreateLeadWithAppointmentSchema = z.object({
  // Lead data
  lead: CreateLeadSchema,
  // Appointment data (lead_id will be auto-populated)
  appointment: CreateAppointmentSchema.omit({ lead_id: true })
});

// Type exports
export type CreateClient = z.infer<typeof CreateClientSchema>;
export type UpdateClient = z.infer<typeof UpdateClientSchema>;
export type Client = z.infer<typeof ClientSchema>;
export type CreateProject = z.infer<typeof CreateProjectSchema>;
export type UpdateProject = z.infer<typeof UpdateProjectSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type CreateLead = z.infer<typeof CreateLeadSchema>;
export type UpdateLead = z.infer<typeof UpdateLeadSchema>;
export type Lead = z.infer<typeof LeadSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
export type Appointment = z.infer<typeof AppointmentSchema>;
export type CreateLeadWithAppointment = z.infer<typeof CreateLeadWithAppointmentSchema>;
export type PierPlacement = z.infer<typeof PierPlacementSchema>;
export type PierPlacements = z.infer<typeof PierPlacementsSchema>;
export type CreateSalesPerson = z.infer<typeof CreateSalesPersonSchema>;
export type UpdateSalesPerson = z.infer<typeof UpdateSalesPersonSchema>;
export type SalesPerson = z.infer<typeof SalesPersonSchema>;
export type ApiError = z.infer<typeof ApiErrorSchema>;

// Photo category schema
export const PhotoCategorySchema = z.enum(["site_condition", "structural_damage", "foundation_issues", "psych_photos", "before_after", "equipment", "other"]);

export const CategorizedPhotoSchema = z.object({
  id: z.number().optional(),
  url: z.string(),
  type: PhotoCategorySchema,
  filename: z.string().optional(),
  description: z.string().optional(),
});

export const CategorizedPhotosSchema = z.array(CategorizedPhotoSchema);

export type PhotoCategory = z.infer<typeof PhotoCategorySchema>;
export type CategorizedPhoto = z.infer<typeof CategorizedPhotoSchema>;

// Financial schemas
export const ExpenseCategorySchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().optional(),
  is_active: z.boolean().default(true),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProjectExpenseSchema = z.object({
  project_id: z.number(),
  category_id: z.number(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  expense_date: z.string(),
  receipt_url: z.string().optional(),
  is_billable: z.boolean().default(true),
  vendor_name: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateProjectExpenseSchema = CreateProjectExpenseSchema.partial().omit({ project_id: true });

export const ProjectExpenseSchema = CreateProjectExpenseSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProjectRevenueSchema = z.object({
  project_id: z.number(),
  description: z.string().min(1, "Description is required"),
  amount: z.number().positive("Amount must be positive"),
  revenue_date: z.string(),
  payment_method: z.string().optional(),
  payment_status: z.enum(["pending", "paid", "partial", "overdue"]).default("pending"),
  invoice_number: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateProjectRevenueSchema = CreateProjectRevenueSchema.partial().omit({ project_id: true });

export const ProjectRevenueSchema = CreateProjectRevenueSchema.extend({
  id: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ProjectFinancialsSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  total_estimated_cost: z.number().optional(),
  total_actual_cost: z.number().optional(),
  total_revenue: z.number().optional(),
  profit_margin: z.number().optional(),
  payment_status: z.enum(["pending", "paid", "partial", "overdue"]).default("pending"),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateProjectFinancialsSchema = ProjectFinancialsSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export const UpdateProjectFinancialsSchema = CreateProjectFinancialsSchema.partial().omit({ project_id: true });

// Report schemas
export const ReportMetricsSchema = z.object({
  total_leads: z.number(),
  active_leads: z.number(),
  converted_leads: z.number(),
  total_appointments: z.number(),
  completed_appointments: z.number(),
  total_projects: z.number(),
  active_projects: z.number(),
  completed_projects: z.number(),
  total_revenue: z.number(),
  total_expenses: z.number(),
  profit_margin: z.number(),
  average_project_value: z.number(),
});

// Type exports
export type ExpenseCategory = z.infer<typeof ExpenseCategorySchema>;
export type CreateProjectExpense = z.infer<typeof CreateProjectExpenseSchema>;
export type UpdateProjectExpense = z.infer<typeof UpdateProjectExpenseSchema>;
export type ProjectExpense = z.infer<typeof ProjectExpenseSchema>;
export type CreateProjectRevenue = z.infer<typeof CreateProjectRevenueSchema>;
export type UpdateProjectRevenue = z.infer<typeof UpdateProjectRevenueSchema>;
export type ProjectRevenue = z.infer<typeof ProjectRevenueSchema>;
export type ProjectFinancials = z.infer<typeof ProjectFinancialsSchema>;
export type CreateProjectFinancials = z.infer<typeof CreateProjectFinancialsSchema>;
export type UpdateProjectFinancials = z.infer<typeof UpdateProjectFinancialsSchema>;
export type ReportMetrics = z.infer<typeof ReportMetricsSchema>;

// Settings schemas
export const EngineerSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateEngineerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  is_active: z.boolean().default(true),
});

export const UpdateEngineerSchema = CreateEngineerSchema.partial();

export const NotificationContactSchema = z.object({
  id: z.number(),
  contact_type: z.string(),
  phone_number: z.string(),
  contact_name: z.string().nullable(),
  is_active: z.boolean(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateNotificationContactSchema = z.object({
  contact_type: z.string().default("project_notification"),
  phone_number: z.string().min(10, "Valid phone number is required"),
  contact_name: z.string().optional(),
  is_active: z.boolean().default(true),
});

export const UpdateNotificationContactSchema = CreateNotificationContactSchema.partial();

export const AppSettingSchema = z.object({
  id: z.number(),
  setting_key: z.string(),
  setting_value: z.string().nullable(),
  description: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const UpdateAppSettingSchema = z.object({
  setting_value: z.string(),
});

export const ProjectWorkflowSchema = z.object({
  id: z.number(),
  project_id: z.number(),
  workflow_type: z.string(),
  status: z.string(),
  assigned_engineer_id: z.number().nullable(),
  engineer_response_received_at: z.string().nullable(),
  notification_sent_at: z.string().nullable(),
  texas_811_ticket_number: z.string().nullable(),
  texas_811_submitted_at: z.string().nullable(),
  assumption_letter_url: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// Type exports
export type Engineer = z.infer<typeof EngineerSchema>;
export type CreateEngineer = z.infer<typeof CreateEngineerSchema>;
export type UpdateEngineer = z.infer<typeof UpdateEngineerSchema>;
export type NotificationContact = z.infer<typeof NotificationContactSchema>;
export type CreateNotificationContact = z.infer<typeof CreateNotificationContactSchema>;
export type UpdateNotificationContact = z.infer<typeof UpdateNotificationContactSchema>;
export type AppSetting = z.infer<typeof AppSettingSchema>;
export type UpdateAppSetting = z.infer<typeof UpdateAppSettingSchema>;
export type ProjectWorkflow = z.infer<typeof ProjectWorkflowSchema>;
