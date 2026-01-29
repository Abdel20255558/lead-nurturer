-- Enum pour les statuts clients
CREATE TYPE public.client_status AS ENUM ('not_contacted', 'in_progress', 'rejected');

-- Enum pour le type de société
CREATE TYPE public.company_type AS ENUM ('SA', 'Non SA');

-- Enum pour la méthode de contact
CREATE TYPE public.contact_method AS ENUM ('email', 'reels');

-- Enum pour le résultat du contact
CREATE TYPE public.contact_result AS ENUM ('pending', 'interested', 'not_interested');

-- Enum pour le type d'interaction
CREATE TYPE public.interaction_type AS ENUM ('call', 'email', 'reels', 'visit', 'other');

-- Table des profils utilisateurs
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table principale des clients
CREATE TABLE public.clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    activity TEXT,
    email TEXT,
    website TEXT,
    phone_fixed TEXT,
    phone_mobile TEXT,
    company_type public.company_type,
    status public.client_status NOT NULL DEFAULT 'not_contacted',
    notes TEXT,
    -- Champs conditionnels (si status = in_progress)
    contact_method public.contact_method,
    offer_sent_date DATE,
    contact_result public.contact_result,
    -- Métadonnées temporelles
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_action_at TIMESTAMPTZ,
    next_follow_up_at TIMESTAMPTZ,
    follow_up_count INTEGER DEFAULT 0
);

-- Table des interactions/historique
CREATE TABLE public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type public.interaction_type NOT NULL,
    date_time TIMESTAMPTZ NOT NULL DEFAULT now(),
    summary TEXT,
    next_step TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des alertes/relances
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table des notifications
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les performances
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_status ON public.clients(status);
CREATE INDEX idx_clients_next_follow_up ON public.clients(next_follow_up_at);
CREATE INDEX idx_interactions_client_id ON public.interactions(client_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_due_date ON public.alerts(due_date);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON public.clients
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Fonction pour créer un profil automatiquement
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour créer le profil à l'inscription
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Fonction pour mettre à jour last_action_at quand une interaction est ajoutée
CREATE OR REPLACE FUNCTION public.update_client_last_action()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.clients
    SET last_action_at = NEW.date_time
    WHERE id = NEW.client_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_interaction_created
    AFTER INSERT ON public.interactions
    FOR EACH ROW EXECUTE FUNCTION public.update_client_last_action();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies pour profiles
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- RLS Policies pour clients
CREATE POLICY "Users can view own clients"
    ON public.clients FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own clients"
    ON public.clients FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
    ON public.clients FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
    ON public.clients FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies pour interactions
CREATE POLICY "Users can view own interactions"
    ON public.interactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own interactions"
    ON public.interactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own interactions"
    ON public.interactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own interactions"
    ON public.interactions FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies pour alerts
CREATE POLICY "Users can view own alerts"
    ON public.alerts FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own alerts"
    ON public.alerts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts"
    ON public.alerts FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own alerts"
    ON public.alerts FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies pour notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);