export type MachineStatus = "running" | "done" | "idle" | "almost";

export interface Machine {
  id: number;
  name: string;
  status: MachineStatus;
  remainingSeconds: number;
  totalSeconds: number;
  customer: string | null;
  customerId: number | null;
  startTime: string | null;
  defaultTimer: number; // minutes
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address: string;
  avatar: string;
}

export interface Order {
  id: number;
  customerId: number;
  customerName: string;
  machineId: number;
  machineName: string;
  weight: number;
  price: number;
  status: "active" | "done" | "cancelled";
  startTime: string;
  endTime: string | null;
  date: string;
}

export interface Notification {
  id: number;
  machineId: number | null;
  machineName: string | null;
  message: string;
  time: string;
  type: "finish" | "new-order" | "warning";
  read: boolean;
}

export const machines: Machine[] = [
  {
    id: 1,
    name: "Mesin 1",
    status: "running",
    remainingSeconds: 1845,
    totalSeconds: 3600,
    customer: "Budi Santoso",
    customerId: 1,
    startTime: "08:15",
    defaultTimer: 60,
  },
  {
    id: 2,
    name: "Mesin 2",
    status: "almost",
    remainingSeconds: 320,
    totalSeconds: 3600,
    customer: "Siti Rahayu",
    customerId: 2,
    startTime: "07:30",
    defaultTimer: 60,
  },
  {
    id: 3,
    name: "Mesin 3",
    status: "done",
    remainingSeconds: 0,
    totalSeconds: 3600,
    customer: "Ahmad Fauzi",
    customerId: 3,
    startTime: "06:45",
    defaultTimer: 60,
  },
  {
    id: 4,
    name: "Mesin 4",
    status: "idle",
    remainingSeconds: 0,
    totalSeconds: 3600,
    customer: null,
    customerId: null,
    startTime: null,
    defaultTimer: 60,
  },
  {
    id: 5,
    name: "Mesin 5",
    status: "running",
    remainingSeconds: 2100,
    totalSeconds: 5400,
    customer: "Dewi Lestari",
    customerId: 4,
    startTime: "09:00",
    defaultTimer: 90,
  },
  {
    id: 6,
    name: "Mesin 6",
    status: "idle",
    remainingSeconds: 0,
    totalSeconds: 3600,
    customer: null,
    customerId: null,
    startTime: null,
    defaultTimer: 60,
  },
];

export const customers: Customer[] = [
  { id: 1, name: "Budi Santoso", phone: "0812-3456-7890", address: "Jl. Merdeka No. 12, Jakarta", avatar: "BS" },
  { id: 2, name: "Siti Rahayu", phone: "0821-9876-5432", address: "Jl. Sudirman No. 45, Bandung", avatar: "SR" },
  { id: 3, name: "Ahmad Fauzi", phone: "0831-2345-6789", address: "Jl. Pahlawan No. 7, Surabaya", avatar: "AF" },
  { id: 4, name: "Dewi Lestari", phone: "0856-7654-3210", address: "Jl. Diponegoro No. 33, Yogyakarta", avatar: "DL" },
];

export const orders: Order[] = [
  {
    id: 1,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 1,
    machineName: "Mesin 1",
    weight: 4.5,
    price: 27000,
    status: "active",
    startTime: "08:15",
    endTime: null,
    date: "19 Apr 2026",
  },
  {
    id: 2,
    customerId: 2,
    customerName: "Siti Rahayu",
    machineId: 2,
    machineName: "Mesin 2",
    weight: 3.0,
    price: 18000,
    status: "active",
    startTime: "07:30",
    endTime: null,
    date: "19 Apr 2026",
  },
  {
    id: 3,
    customerId: 3,
    customerName: "Ahmad Fauzi",
    machineId: 3,
    machineName: "Mesin 3",
    weight: 5.5,
    price: 33000,
    status: "done",
    startTime: "06:45",
    endTime: "07:45",
    date: "19 Apr 2026",
  },
  {
    id: 4,
    customerId: 4,
    customerName: "Dewi Lestari",
    machineId: 5,
    machineName: "Mesin 5",
    weight: 2.5,
    price: 15000,
    status: "active",
    startTime: "09:00",
    endTime: null,
    date: "19 Apr 2026",
  },
  {
    id: 5,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 3,
    machineName: "Mesin 3",
    weight: 3.5,
    price: 21000,
    status: "done",
    startTime: "14:00",
    endTime: "15:00",
    date: "18 Apr 2026",
  },
  {
    id: 6,
    customerId: 2,
    customerName: "Siti Rahayu",
    machineId: 1,
    machineName: "Mesin 1",
    weight: 4.0,
    price: 24000,
    status: "done",
    startTime: "10:30",
    endTime: "11:30",
    date: "17 Apr 2026",
  },
];

export const adminNotifications: Notification[] = [
  {
    id: 1,
    machineId: 3,
    machineName: "Mesin 3",
    message: "Mesin 3 telah selesai mencuci. Pelanggan: Ahmad Fauzi",
    time: "09:45",
    type: "finish",
    read: false,
  },
  {
    id: 2,
    machineId: 2,
    machineName: "Mesin 2",
    message: "Mesin 2 hampir selesai! Sisa waktu 5 menit.",
    time: "09:50",
    type: "warning",
    read: false,
  },
  {
    id: 3,
    machineId: 1,
    machineName: "Mesin 1",
    message: "Pesanan baru diterima untuk Mesin 1. Pelanggan: Budi Santoso",
    time: "08:15",
    type: "new-order",
    read: true,
  },
  {
    id: 4,
    machineId: 5,
    machineName: "Mesin 5",
    message: "Pesanan baru diterima untuk Mesin 5. Pelanggan: Dewi Lestari",
    time: "09:00",
    type: "new-order",
    read: true,
  },
  {
    id: 5,
    machineId: null,
    machineName: null,
    message: "Pelanggan baru mendaftar: Dewi Lestari",
    time: "08:55",
    type: "new-order",
    read: true,
  },
];

export const customerNotifications = [
  {
    id: 1,
    message: "Laundry kamu sudah selesai! Silakan ambil di konter.",
    time: "09:45",
    read: false,
  },
  {
    id: 2,
    message: "Pesanan kamu sedang dicuci di Mesin 1. Estimasi selesai 09:15.",
    time: "08:15",
    read: true,
  },
  {
    id: 3,
    message: "Pesanan berhasil diterima. Nomor order: #LK-005",
    time: "08:10",
    read: true,
  },
];

export const customerOrders: Order[] = [
  {
    id: 1,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 1,
    machineName: "Mesin 1",
    weight: 4.5,
    price: 27000,
    status: "active",
    startTime: "08:15",
    endTime: null,
    date: "19 Apr 2026",
  },
  {
    id: 5,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 3,
    machineName: "Mesin 3",
    weight: 3.5,
    price: 21000,
    status: "done",
    startTime: "14:00",
    endTime: "15:00",
    date: "18 Apr 2026",
  },
  {
    id: 6,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 1,
    machineName: "Mesin 1",
    weight: 4.0,
    price: 24000,
    status: "done",
    startTime: "10:30",
    endTime: "11:30",
    date: "17 Apr 2026",
  },
  {
    id: 7,
    customerId: 1,
    customerName: "Budi Santoso",
    machineId: 2,
    machineName: "Mesin 2",
    weight: 2.0,
    price: 12000,
    status: "cancelled",
    startTime: "13:00",
    endTime: null,
    date: "15 Apr 2026",
  },
];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function getStatusColor(status: MachineStatus): string {
  switch (status) {
    case "running": return "#3B82F6";
    case "done": return "#22C55E";
    case "idle": return "#94A3B8";
    case "almost": return "#F97316";
  }
}

export function getStatusBg(status: MachineStatus): string {
  switch (status) {
    case "running": return "#EFF6FF";
    case "done": return "#F0FDF4";
    case "idle": return "#F8FAFC";
    case "almost": return "#FFF7ED";
  }
}

export function getStatusLabel(status: MachineStatus): string {
  switch (status) {
    case "running": return "Berjalan";
    case "done": return "Selesai";
    case "idle": return "Menunggu";
    case "almost": return "Hampir Selesai";
  }
}

export function formatPrice(price: number): string {
  return `Rp ${price.toLocaleString("id-ID")}`;
}
