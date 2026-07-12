import { requireRole } from "@/lib/dal";
import { db } from "@/lib/db";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DepartmentsTab } from "./departments-tab";
import { CategoriesTab } from "./categories-tab";
import { DirectoryTab } from "./directory-tab";

export default async function OrgSetupPage() {
  const admin = await requireRole(["ADMIN"]);

  const [departments, categories, employees] = await Promise.all([
    db.department.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        headId: true,
        parentDepartmentId: true,
        head: { select: { id: true, name: true } },
        parentDepartment: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
    db.assetCategory.findMany({
      select: { id: true, name: true, extraFields: true },
      orderBy: { name: "asc" },
    }),
    db.employee.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  const activeEmployees = employees.filter((employee) => employee.status === "ACTIVE");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-display-sm text-on-dark">Organization Setup</h1>
        <p className="mt-1 text-body-md text-muted">
          Manage departments, asset categories, and the employee directory.
        </p>
      </div>

      <Tabs defaultValue="departments">
        <TabsList>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="categories">Asset Categories</TabsTrigger>
          <TabsTrigger value="directory">Employee Directory</TabsTrigger>
        </TabsList>
        <TabsContent value="departments">
          <DepartmentsTab departments={departments} employees={activeEmployees} />
        </TabsContent>
        <TabsContent value="categories">
          <CategoriesTab categories={categories} />
        </TabsContent>
        <TabsContent value="directory">
          <DirectoryTab
            employees={employees}
            departments={departments}
            currentUserId={admin.id}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
