import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";

export default function Profile() {
  const { data: user } = useGetMe({
    query: { queryKey: getGetMeQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight text-white">Admin Profile</h1>
      </div>
      <div className="p-8 border border-border rounded-lg bg-card max-w-xl">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="text-lg text-foreground mt-1">{user?.username}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Role</label>
            <div className="text-lg text-foreground mt-1 uppercase tracking-wider text-primary">{user?.role}</div>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Admin ID</label>
            <div className="text-sm text-foreground mt-1 font-mono">{user?.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}