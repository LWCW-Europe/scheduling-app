import { vi } from "vitest";

export const mockRedirect = vi.fn<(url: string) => never>();
export const mockRevalidatePath = vi.fn<(path: string) => void>();

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
  useRouter: vi.fn(),
  usePathname: vi.fn(),
  useSearchParams: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  revalidateTag: vi.fn(),
}));
