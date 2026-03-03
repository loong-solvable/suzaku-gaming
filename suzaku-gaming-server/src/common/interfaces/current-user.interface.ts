export interface CurrentUser {
  id: number;
  username: string;
  realName: string;
  role: string;
  level: number;
  parentId: number | null;
  cpsGroupCode: string | null;
  memberCode: string | null;
  status: number;
}
