import { z } from "zod";

export const RegistracijaSchema = z.object({
  firma: z.string().trim().min(2, "Naziv firme mora imati bar 2 znaka."),
  ime: z.string().trim().min(2, "Ime mora imati bar 2 znaka."),
  email: z.email("Unesite ispravnu email adresu.").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Lozinka mora imati bar 8 znakova.")
    .regex(/[a-zA-Z]/, "Lozinka mora sadržavati bar jedno slovo.")
    .regex(/[0-9]/, "Lozinka mora sadržavati bar jedan broj."),
});

export type RegistracijaState =
  | {
      errors?: {
        firma?: string[];
        ime?: string[];
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;

export const PrijavaSchema = z.object({
  email: z.email("Unesite ispravnu email adresu.").trim().toLowerCase(),
  password: z.string().min(1, "Unesite lozinku."),
});

export type PrijavaState =
  | {
      errors?: {
        email?: string[];
        password?: string[];
      };
      message?: string;
    }
  | undefined;
