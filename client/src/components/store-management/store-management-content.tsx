import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Building, Users, MapPin, Edit, Trash2, Plus, Phone, Clock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const storeSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().min(1, "Address is required"),
  phone: z.string().min(1, "Phone number is required"),
  manager: z.string().optional(),
  description: z.string().optional(),
  entryTimeStart: z.string().default("07:00"),
  entryTimeEnd: z.string().default("09:00"),
  exitTimeStart: z.string().default("17:00"),
  exitTimeEnd: z.string().default("19:00"),
  timezone: z.string().default("Asia/Jakarta"),
  shifts: z.string().optional(),
});

type StoreData = z.infer<typeof storeSchema>;

interface Shift {
  name: string;
  start: string;
  end: string;
}

interface StoreInfo {
  id: number;
  name: string;
  address: string;
  phone: string;
  manager?: string;
  description?: string;
  entryTimeStart?: string;
  entryTimeEnd?: string;
  exitTimeStart?: string;
  exitTimeEnd?: string;
  timezone?: string;
  shifts?: string;
  employeeCount: number;
  status: "active" | "inactive";
  createdAt: string;
}

interface ShiftManagementSectionProps {
  shifts: Shift[];
  onAdd: (shift: Shift) => void;
  onEdit: (index: number, shift: Shift) => void;
  onDelete: (index: number) => void;
}

function ShiftManagementSection({ shifts, onAdd, onEdit, onDelete }: ShiftManagementSectionProps) {
  const [newShift, setNewShift] = useState<Shift>({ name: "", start: "07:00", end: "15:00" });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editShift, setEditShift] = useState<Shift>({ name: "", start: "", end: "" });
  const [error, setError] = useState<string>("");

  const validateShiftTimes = (start: string, end: string): boolean => {
    if (!start || !end) {
      setError("Waktu shift harus diisi");
      return false;
    }

    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }

    return true;
  };

  const handleAdd = () => {
    if (!newShift.name.trim()) {
      setError("Nama shift harus diisi");
      return;
    }

    if (!validateShiftTimes(newShift.start, newShift.end)) {
      return;
    }

    onAdd(newShift);
    setNewShift({ name: "", start: "07:00", end: "15:00" });
    setError("");
  };

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setEditShift({ ...shifts[index] });
    setError("");
  };

  const handleEditSave = () => {
    if (editingIndex === null) return;

    if (!editShift.name.trim()) {
      setError("Nama shift harus diisi");
      return;
    }

    if (!validateShiftTimes(editShift.start, editShift.end)) {
      return;
    }

    onEdit(editingIndex, editShift);
    setEditingIndex(null);
    setError("");
  };

  const handleEditCancel = () => {
    setEditingIndex(null);
    setError("");
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <Label className="text-sm font-semibold text-blue-900 flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4" />
          Manajemen Shift
        </Label>
        <p className="text-xs text-blue-700 mb-4">
          Tambah shift kustom untuk toko ini. Jika tidak diatur, akan menggunakan shift default (Pagi, Siang, Malam).
        </p>

        {error && (
          <div className="p-2 mb-3 bg-red-100 border border-red-300 rounded text-xs text-red-700">
            {error}
          </div>
        )}

        {shifts.length > 0 && (
          <div className="mb-4 space-y-2">
            {shifts.map((shift, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded border border-gray-200"
              >
                {editingIndex === index ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editShift.name}
                      onChange={(e) => setEditShift({ ...editShift, name: e.target.value })}
                      placeholder="Nama shift"
                      className="w-32"
                      data-testid={`input-edit-shift-name-${index}`}
                    />
                    <Input
                      type="time"
                      value={editShift.start}
                      onChange={(e) => setEditShift({ ...editShift, start: e.target.value })}
                      className="w-28"
                      data-testid={`input-edit-shift-start-${index}`}
                    />
                    <span className="text-gray-400">-</span>
                    <Input
                      type="time"
                      value={editShift.end}
                      onChange={(e) => setEditShift({ ...editShift, end: e.target.value })}
                      className="w-28"
                      data-testid={`input-edit-shift-end-${index}`}
                    />
                    <Button
                      size="sm"
                      onClick={handleEditSave}
                      data-testid={`button-save-shift-${index}`}
                    >
                      Simpan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleEditCancel}
                      data-testid={`button-cancel-edit-shift-${index}`}
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="font-medium">
                        {shift.name}
                      </Badge>
                      <span className="text-sm text-gray-600">
                        {shift.start} - {shift.end}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditClick(index)}
                        data-testid={`button-edit-shift-${index}`}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(index)}
                        data-testid={`button-delete-shift-${index}`}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Input
            value={newShift.name}
            onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
            placeholder="Nama shift (e.g., Pagi)"
            className="w-40"
            data-testid="input-new-shift-name"
          />
          <Input
            type="time"
            value={newShift.start}
            onChange={(e) => setNewShift({ ...newShift, start: e.target.value })}
            className="w-32"
            data-testid="input-new-shift-start"
          />
          <span className="text-gray-400">-</span>
          <Input
            type="time"
            value={newShift.end}
            onChange={(e) => setNewShift({ ...newShift, end: e.target.value })}
            className="w-32"
            data-testid="input-new-shift-end"
          />
          <Button
            size="sm"
            onClick={handleAdd}
            data-testid="button-add-shift"
          >
            <Plus className="h-4 w-4 mr-1" />
            Tambah Shift
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function StoreManagementContent() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("list");
  const [selectedStore, setSelectedStore] = useState<StoreInfo | null>(null);
  const [editingStore, setEditingStore] = useState<StoreInfo | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createShifts, setCreateShifts] = useState<Shift[]>([]);
  const [editShifts, setEditShifts] = useState<Shift[]>([]);

  const { data: stores = [], refetch: refetchStores, isLoading: storesLoading, error: storesError } = useQuery<StoreInfo[]>({
    queryKey: ["/api/stores"],
    enabled: user?.role === "manager",
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "manager",
  });

  const { data: storeEmployees = [], isLoading: employeesLoading, error: employeesError } = useQuery<any[]>({
    queryKey: ["/api/stores", selectedStore?.id, "employees"],
    enabled: user?.role === "manager" && !!selectedStore,
  });

  const createStoreMutation = useMutation({
    mutationFn: async (data: StoreData) => {
      const response = await apiRequest('POST', '/api/stores', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Sukses",
        description: "Toko berhasil dibuat",
      });
      refetchStores();
      setActiveTab("list");
      setCreateShifts([]);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<StoreData> }) => {
      const response = await apiRequest('PATCH', `/api/stores/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "✅ Sukses",
        description: "Toko berhasil diupdate",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stores"] });
      setEditDialogOpen(false);
      setEditingStore(null);
      setEditShifts([]);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error",
        description: error.message || "Gagal update toko",
        variant: "destructive",
      });
    },
  });

  const createForm = useForm<StoreData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      manager: "",
      description: "",
      entryTimeStart: "07:00",
      entryTimeEnd: "09:00",
      exitTimeStart: "17:00",
      exitTimeEnd: "19:00",
      timezone: "Asia/Jakarta",
      shifts: "",
    },
  });

  const editForm = useForm<StoreData>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      manager: "",
      description: "",
      entryTimeStart: "07:00",
      entryTimeEnd: "09:00",
      exitTimeStart: "17:00",
      exitTimeEnd: "19:00",
      timezone: "Asia/Jakarta",
      shifts: "",
    },
  });

  const onCreateStore = (data: StoreData) => {
    const shiftsJson = createShifts.length > 0 ? JSON.stringify(createShifts) : "";
    createStoreMutation.mutate({ ...data, shifts: shiftsJson });
  };

  const onEditStore = (data: StoreData) => {
    if (editingStore) {
      const shiftsJson = editShifts.length > 0 ? JSON.stringify(editShifts) : "";
      updateStoreMutation.mutate({ id: editingStore.id, data: { ...data, shifts: shiftsJson } });
    }
  };

  const openEditDialog = (store: StoreInfo) => {
    setEditingStore(store);
    
    let parsedShifts: Shift[] = [];
    if (store.shifts) {
      try {
        parsedShifts = JSON.parse(store.shifts);
      } catch (e) {
        console.error("Failed to parse shifts:", e);
      }
    }
    setEditShifts(parsedShifts);
    
    editForm.reset({
      name: store.name,
      address: store.address,
      phone: store.phone,
      manager: store.manager || "",
      description: store.description || "",
      entryTimeStart: store.entryTimeStart || "07:00",
      entryTimeEnd: store.entryTimeEnd || "09:00", 
      exitTimeStart: store.exitTimeStart || "17:00",
      exitTimeEnd: store.exitTimeEnd || "19:00",
      timezone: store.timezone || "Asia/Jakarta",
      shifts: store.shifts || "",
    });
    setEditDialogOpen(true);
  };

  const closeEditDialog = () => {
    setEditDialogOpen(false);
    setEditingStore(null);
    setEditShifts([]);
    editForm.reset();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (user?.role !== "manager") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Store className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">Access denied. Manager role required.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manajemen Toko</h1>
          <p className="text-gray-600">Kelola informasi toko dan personel</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">Daftar Toko</TabsTrigger>
          <TabsTrigger value="create">Buat Toko</TabsTrigger>
          {selectedStore && <TabsTrigger value="employees">Karyawan Toko</TabsTrigger>}
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Direktori Toko
              </CardTitle>
            </CardHeader>
            <CardContent>
              {storesError && (
                <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-700 text-sm">Error loading stores: {(storesError as any)?.message}</p>
                </div>
              )}
              {storesLoading && (
                <div className="flex items-center justify-center p-8">
                  <p className="text-gray-500">Memuat toko...</p>
                </div>
              )}
              {!storesLoading && stores.length === 0 && !storesError && (
                <div className="text-center p-8">
                  <Building className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Tidak ada toko</p>
                  <p className="text-sm text-gray-400 mt-1">Buat toko pertama Anda untuk memulai</p>
                </div>
              )}
              {!storesLoading && stores.length > 0 && (
              <Table data-testid="table-stores">
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Toko</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Karyawan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell className="font-medium">{store.name}</TableCell>
                      <TableCell>{store.address}</TableCell>
                      <TableCell>{store.manager || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {store.employeeCount || 0}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeColor(store.status)}>
                          {store.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStore(store);
                              setActiveTab("employees");
                            }}
                            data-testid={`button-view-employees-${store.id}`}
                            title="Lihat Karyawan"
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditDialog(store)}
                            data-testid={`button-edit-store-${store.id}`}
                            title="Edit Toko"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Buat Toko Baru
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...createForm}>
                <form onSubmit={createForm.handleSubmit(onCreateStore)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={createForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Toko</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nama toko" 
                              data-testid="input-store-name"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nomor Telepon</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Masukkan nomor telepon" 
                              data-testid="input-store-phone"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={createForm.control}
                      name="manager"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Manager</FormLabel>
                          <FormControl>
                            <Select value={field.value || ""} onValueChange={field.onChange}>
                              <SelectTrigger data-testid="select-store-manager">
                                <SelectValue placeholder="Pilih manager" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="no-manager">Tidak ada manager</SelectItem>
                                {users
                                  .filter(user => user.role === 'manager')
                                  .map((manager) => (
                                    <SelectItem key={manager.id} value={manager.name}>
                                      {manager.name}
                                    </SelectItem>
                                  ))
                                }
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={createForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Alamat</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Masukkan alamat toko" 
                            data-testid="input-store-address"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deskripsi</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Masukkan deskripsi toko" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <ShiftManagementSection
                    shifts={createShifts}
                    onAdd={(shift) => setCreateShifts([...createShifts, shift])}
                    onEdit={(index, shift) => {
                      const newShifts = [...createShifts];
                      newShifts[index] = shift;
                      setCreateShifts(newShifts);
                    }}
                    onDelete={(index) => setCreateShifts(createShifts.filter((_, i) => i !== index))}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Pengaturan Waktu Masuk</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={createForm.control}
                          name="entryTimeStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Waktu Mulai</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  data-testid="input-entry-time-start"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="entryTimeEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Waktu Akhir</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  data-testid="input-entry-time-end"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-sm font-medium text-gray-700">Pengaturan Waktu Keluar</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <FormField
                          control={createForm.control}
                          name="exitTimeStart"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Waktu Mulai</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  data-testid="input-exit-time-start"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="exitTimeEnd"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Waktu Akhir</FormLabel>
                              <FormControl>
                                <Input 
                                  type="time" 
                                  data-testid="input-exit-time-end"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={createForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <FormControl>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Pilih timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                              <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                              <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={createStoreMutation.isPending}
                    data-testid="button-create-store"
                  >
                    {createStoreMutation.isPending ? "Membuat..." : "Buat Toko"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {selectedStore && (
          <TabsContent value="employees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  {selectedStore.name} - Karyawan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Label className="text-sm font-medium flex items-center gap-1">
                        <Building className="h-4 w-4" />
                        Info Toko
                      </Label>
                      <p className="text-sm text-gray-600 font-medium" data-testid={`text-store-name-${selectedStore.id}`}>{selectedStore.name}</p>
                      <p className="text-xs text-gray-500 flex items-start gap-1 mt-1">
                        <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        {selectedStore.address}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Kontak</Label>
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedStore.phone || "Tidak ada telepon"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Manager</Label>
                      <p className="text-sm text-gray-600">{selectedStore.manager || "Tidak ada manager"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Total Karyawan</Label>
                      <p className="text-sm text-gray-600 font-bold">{selectedStore.employeeCount || 0}</p>
                    </div>
                  </div>
                </div>

                {employeesLoading && (
                  <div className="flex items-center justify-center p-8">
                    <p className="text-gray-500">Memuat karyawan...</p>
                  </div>
                )}

                {!employeesLoading && storeEmployees.length === 0 && (
                  <div className="text-center p-8">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-gray-500">Tidak ada karyawan</p>
                  </div>
                )}

                {!employeesLoading && storeEmployees.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Phone</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeEmployees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">{employee.name}</TableCell>
                          <TableCell>{employee.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{employee.role}</Badge>
                          </TableCell>
                          <TableCell>{employee.phone || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Toko</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditStore)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Toko</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan nama toko" 
                          data-testid="input-edit-store-name"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Masukkan nomor telepon" 
                          data-testid="input-edit-store-phone"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="manager"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manager</FormLabel>
                      <FormControl>
                        <Select value={field.value || ""} onValueChange={field.onChange}>
                          <SelectTrigger data-testid="select-edit-store-manager">
                            <SelectValue placeholder="Pilih manager" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-manager">Tidak ada manager</SelectItem>
                            {users
                              .filter(user => user.role === 'manager')
                              .map((manager) => (
                                <SelectItem key={manager.id} value={manager.name}>
                                  {manager.name}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alamat</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Masukkan alamat toko" 
                        data-testid="input-edit-store-address"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan deskripsi toko" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <ShiftManagementSection
                shifts={editShifts}
                onAdd={(shift) => setEditShifts([...editShifts, shift])}
                onEdit={(index, shift) => {
                  const newShifts = [...editShifts];
                  newShifts[index] = shift;
                  setEditShifts(newShifts);
                }}
                onDelete={(index) => setEditShifts(editShifts.filter((_, i) => i !== index))}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Pengaturan Waktu Masuk</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={editForm.control}
                      name="entryTimeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Waktu Mulai</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              data-testid="input-edit-entry-time-start"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="entryTimeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Waktu Akhir</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              data-testid="input-edit-entry-time-end"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-gray-700">Pengaturan Waktu Keluar</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <FormField
                      control={editForm.control}
                      name="exitTimeStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Waktu Mulai</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              data-testid="input-edit-exit-time-start"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="exitTimeEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Waktu Akhir</FormLabel>
                          <FormControl>
                            <Input 
                              type="time" 
                              data-testid="input-edit-exit-time-end"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <FormField
                control={editForm.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger data-testid="select-edit-timezone">
                          <SelectValue placeholder="Pilih timezone" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Asia/Jakarta">Asia/Jakarta (WIB)</SelectItem>
                          <SelectItem value="Asia/Makassar">Asia/Makassar (WITA)</SelectItem>
                          <SelectItem value="Asia/Jayapura">Asia/Jayapura (WIT)</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={updateStoreMutation.isPending}
                  data-testid="button-update-store"
                >
                  {updateStoreMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
                <Button 
                  type="button"
                  variant="outline"
                  onClick={closeEditDialog}
                  data-testid="button-cancel-edit-store"
                >
                  Batal
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
