/**
 * A department cannot be its own parent. This is a shallow check only —
 * deep ancestor-cycle detection is intentionally out of scope.
 */
export function isValidDepartmentParent(
  departmentId: string | undefined,
  parentDepartmentId: string | null | undefined,
): boolean {
  if (!departmentId || !parentDepartmentId) return true;
  return departmentId !== parentDepartmentId;
}
