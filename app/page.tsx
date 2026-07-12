"use client";

import { useState } from "react";
import { AppShell } from "@/components/shell/app-shell";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";

const KPIS = [
  { label: "Assets Available", value: 128 },
  { label: "Assets Allocated", value: 342 },
  { label: "Maintenance Today", value: 4 },
  { label: "Active Bookings", value: 11 },
];

const SAMPLE_ASSETS = [
  { tag: "AF-0001", name: "Dell Latitude 5440", status: "ALLOCATED" as const },
  { tag: "AF-0002", name: "Conference Room B2", status: "AVAILABLE" as const },
  { tag: "AF-0003", name: "Forklift #3", status: "UNDER_MAINTENANCE" as const },
];

const STATUS_TONE = {
  AVAILABLE: "success",
  ALLOCATED: "info",
  UNDER_MAINTENANCE: "warning",
} as const;

export default function StyleGuidePreview() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <AppShell user={{ name: "Preview User", role: "ADMIN" }} unreadCount={2}>
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <div>
          <h1 className="text-display-sm text-on-dark">AssetFlow</h1>
          <p className="mt-1 text-body-md text-muted">
            Foundation preview — design tokens, UI kit, and app shell. Login/signup and the real
            dashboard land in the next sections.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {KPIS.map((kpi) => (
            <Card key={kpi.label}>
              <p className="text-caption text-muted">{kpi.label}</p>
              <p className="mt-1 font-numeric text-number-display text-primary">{kpi.value}</p>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              Register Asset
            </Button>
          </CardHeader>
          <Table>
            <TableHead>
              <TableRow>
                <TableHeadCell>Tag</TableHeadCell>
                <TableHeadCell>Name</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SAMPLE_ASSETS.map((asset) => (
                <TableRow key={asset.tag}>
                  <TableCell className="font-numeric text-number-sm">{asset.tag}</TableCell>
                  <TableCell>{asset.name}</TableCell>
                  <TableCell>
                    <Badge tone={STATUS_TONE[asset.status]}>{asset.status.replace("_", " ")}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <Card>
          <Tabs defaultValue="departments">
            <TabsList>
              <TabsTrigger value="departments">Departments</TabsTrigger>
              <TabsTrigger value="categories">Asset Categories</TabsTrigger>
              <TabsTrigger value="directory">Employee Directory</TabsTrigger>
            </TabsList>
            <TabsContent value="departments">
              <p className="text-body-md text-muted">Org Setup tabs land in Section 2.</p>
            </TabsContent>
            <TabsContent value="categories">
              <p className="text-body-md text-muted">Org Setup tabs land in Section 2.</p>
            </TabsContent>
            <TabsContent value="directory">
              <p className="text-body-md text-muted">Org Setup tabs land in Section 2.</p>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="primary-pill">Primary Pill</Button>
          <Button variant="secondary-dark">Secondary</Button>
          <Button variant="tertiary">Tertiary</Button>
          <Button variant="trading-up">Verified</Button>
          <Button variant="trading-down">Missing</Button>
          <Button variant="danger">Delete</Button>
          <Button
            variant="secondary-dark"
            onClick={() => toast({ title: "Toast works", tone: "success" })}
          >
            Fire toast
          </Button>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="Register Asset"
        description="Form fields land in Section 3 (Assets)."
      >
        <div className="flex flex-col gap-3">
          <div>
            <Label htmlFor="asset-name">Asset name</Label>
            <Input id="asset-name" placeholder="e.g. Dell Latitude 5440" />
          </div>
          <Button variant="primary" onClick={() => setModalOpen(false)}>
            Close
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
