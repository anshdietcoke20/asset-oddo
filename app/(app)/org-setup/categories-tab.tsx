"use client";

import { useActionState, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHead,
  TableHeadCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { Input, Label, FieldError, Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { upsertCategoryAction, type OrgFormState } from "@/lib/actions/org";
import { useCloseOnSuccess } from "@/lib/hooks/use-close-on-success";

export interface CategoryRow {
  id: string;
  name: string;
  extraFields: unknown;
}

export function CategoriesTab({ categories }: { categories: CategoryRow[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [state, formAction, isSubmitting] = useActionState<OrgFormState, FormData>(
    upsertCategoryAction,
    undefined,
  );

  useEffect(() => {
    if (state?.success) {
      toast({ title: state.success, tone: "success" });
    }
  }, [state]);
  useCloseOnSuccess(state, () => {
    setModalOpen(false);
    setEditing(null);
  });

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(category: CategoryRow) {
    setEditing(category);
    setModalOpen(true);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Categories</CardTitle>
        <Button variant="primary" onClick={openCreate}>
          New category
        </Button>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeadCell>Name</TableHeadCell>
            <TableHeadCell>Extra fields</TableHeadCell>
            <TableHeadCell>Actions</TableHeadCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {categories.map((category) => (
            <TableRow key={category.id}>
              <TableCell>{category.name}</TableCell>
              <TableCell className="max-w-xs truncate text-muted">
                {category.extraFields ? JSON.stringify(category.extraFields) : "—"}
              </TableCell>
              <TableCell>
                <Button variant="tertiary" onClick={() => openEdit(category)}>
                  Edit
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {categories.length === 0 && (
            <TableRow>
              <TableCell colSpan={3} className="text-muted">
                No categories yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editing ? "Edit category" : "New category"}
      >
        <form key={editing?.id ?? "new"} action={formAction} className="flex flex-col gap-4">
          {editing && <input type="hidden" name="id" value={editing.id} />}
          <div>
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" name="name" defaultValue={editing?.name} required />
            <FieldError>{state?.fieldErrors?.name?.[0]}</FieldError>
          </div>
          <div>
            <Label htmlFor="cat-extra">Extra fields (JSON, optional)</Label>
            <Textarea
              id="cat-extra"
              name="extraFields"
              rows={4}
              defaultValue={
                editing?.extraFields ? JSON.stringify(editing.extraFields, null, 2) : ""
              }
              placeholder='{"warrantyMonths": 12}'
            />
            <FieldError>{state?.fieldErrors?.extraFields?.[0]}</FieldError>
          </div>
          {state?.error && <p className="text-body-sm text-danger">{state.error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary-dark" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </Modal>
    </Card>
  );
}
