export type DriverApplicationStatus = "draft" | "pending" | "approved" | "rejected";

export interface DriverApplication {
  status: DriverApplicationStatus;
  currentStep: number;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  personal: {
    fullName: string;
    cpf: string;
    birthDate: string;
    phone: string;
    city: string;
  };
  identity: {
    selfieName: string;
    identityDocumentName: string;
  };
  license: {
    number: string;
    category: string;
    expiry: string;
    documentName: string;
  };
  vehicle: {
    brand: string;
    model: string;
    year: string;
    color: string;
    plate: string;
    capacity: string;
    photoName: string;
    airConditioning: boolean;
    acceptsPet: boolean;
    baggage: boolean;
  };
  documents: {
    vehicleDocumentName: string;
    residenceProofName: string;
  };
}

const STORAGE_KEY = "connexy_driver_application_v1";

export const EMPTY_DRIVER_APPLICATION: DriverApplication = {
  status: "draft",
  currentStep: 0,
  personal: {
    fullName: "",
    cpf: "",
    birthDate: "",
    phone: "",
    city: "",
  },
  identity: {
    selfieName: "",
    identityDocumentName: "",
  },
  license: {
    number: "",
    category: "",
    expiry: "",
    documentName: "",
  },
  vehicle: {
    brand: "",
    model: "",
    year: "",
    color: "",
    plate: "",
    capacity: "",
    photoName: "",
    airConditioning: false,
    acceptsPet: false,
    baggage: false,
  },
  documents: {
    vehicleDocumentName: "",
    residenceProofName: "",
  },
};

export function getDriverApplication(): DriverApplication {
  if (typeof window === "undefined") return EMPTY_DRIVER_APPLICATION;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_DRIVER_APPLICATION;
    return { ...EMPTY_DRIVER_APPLICATION, ...JSON.parse(raw) } as DriverApplication;
  } catch {
    return EMPTY_DRIVER_APPLICATION;
  }
}

export function saveDriverApplication(application: DriverApplication): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(application));
  window.dispatchEvent(new Event("driverApplicationChanged"));
}

export function isDriverApproved(): boolean {
  return getDriverApplication().status === "approved";
}
