"use server"

// =================================================================
// PLACEHOLDER: Collegamento a Supabase per salvare i contatti
// =================================================================
// Per collegare Supabase:
// 1. Installa @supabase/supabase-js
// 2. Crea una tabella "contacts" con i campi: id, name, email, phone, message, created_at
// 3. Configura le variabili d'ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY
// 4. Importa il client Supabase e sostituisci la logica placeholder
//
// Esempio schema SQL:
// CREATE TABLE contacts (
//   id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
//   name TEXT NOT NULL,
//   email TEXT NOT NULL,
//   phone TEXT,
//   message TEXT NOT NULL,
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
// =================================================================

export interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
}

export interface ContactFormResult {
  success: boolean
  error?: string
}

export async function submitContactForm(data: ContactFormData): Promise<ContactFormResult> {
  try {
    // Validazione server-side
    if (!data.name || data.name.length < 2) {
      return { success: false, error: "Il nome deve essere di almeno 2 caratteri" }
    }

    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { success: false, error: "Email non valida" }
    }

    if (!data.message || data.message.length < 10) {
      return { success: false, error: "Il messaggio deve essere di almeno 10 caratteri" }
    }

    // =================================================================
    // PLACEHOLDER: Qui inserire la logica per salvare su Supabase
    // =================================================================
    // const { error } = await supabase.from('contacts').insert({
    //   name: data.name,
    //   email: data.email,
    //   phone: data.phone || null,
    //   message: data.message,
    // });
    //
    // if (error) {
    //   console.error('Supabase error:', error);
    //   return { success: false, error: "Errore nel salvataggio dei dati" };
    // }
    // =================================================================

    // Simula un delay per demo
    await new Promise((resolve) => setTimeout(resolve, 1000))

    console.log("Contact form submitted:", data)

    return { success: true }
  } catch (error) {
    console.error("Error submitting contact form:", error)
    return { success: false, error: "Si è verificato un errore. Riprova più tardi." }
  }
}
