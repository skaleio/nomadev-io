-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED');
CREATE TYPE validation_status AS ENUM ('PENDING', 'VALIDATED', 'REJECTED', 'EXPIRED');
CREATE TYPE conversation_status AS ENUM ('ACTIVE', 'PAUSED', 'ARCHIVED', 'BLOCKED');
CREATE TYPE message_type AS ENUM ('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO', 'VIDEO', 'LOCATION', 'CONTACT');
CREATE TYPE message_direction AS ENUM ('INBOUND', 'OUTBOUND');
CREATE TYPE message_status AS ENUM ('SENT', 'DELIVERED', 'READ', 'FAILED');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shops table
CREATE TABLE public.shops (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_shop_id TEXT UNIQUE NOT NULL,
    shopify_domain TEXT UNIQUE NOT NULL,
    shopify_access_token TEXT NOT NULL,
    shopify_scope TEXT NOT NULL,
    shop_name TEXT NOT NULL,
    shop_email TEXT,
    shop_phone TEXT,
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL
);

-- Create orders table (without customer_id first)
CREATE TABLE public.orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_order_id TEXT UNIQUE NOT NULL,
    order_number TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    total_price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status order_status DEFAULT 'PENDING',
    fulfillment_status TEXT,
    validation_status validation_status DEFAULT 'PENDING',
    validation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    customer_id UUID
);

-- Create products table
CREATE TABLE public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_product_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    handle TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL
);

-- Create customers table
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    shopify_customer_id TEXT UNIQUE NOT NULL,
    email TEXT,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    total_spent DECIMAL(10,2) DEFAULT 0,
    orders_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL
);

-- Add foreign key constraint to orders table
ALTER TABLE public.orders 
ADD CONSTRAINT fk_orders_customer_id 
FOREIGN KEY (customer_id) REFERENCES public.customers(id);

-- Create conversations table
CREATE TABLE public.conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    phone_number TEXT NOT NULL,
    status conversation_status DEFAULT 'ACTIVE',
    last_message TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    shop_id UUID REFERENCES public.shops(id) ON DELETE CASCADE NOT NULL,
    order_id UUID REFERENCES public.orders(id)
);

-- Create messages table
CREATE TABLE public.messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    message_id TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    type message_type DEFAULT 'TEXT',
    direction message_direction NOT NULL,
    status message_status DEFAULT 'SENT',
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL
);

-- Create refresh_tokens table
CREATE TABLE public.refresh_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL
);

-- Create webhook_logs table
CREATE TABLE public.webhook_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    source TEXT NOT NULL, -- 'shopify', 'evolution', 'n8n'
    event TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL, -- 'success', 'error', 'pending'
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL
);

-- Create indexes for better performance
CREATE INDEX idx_shops_user_id ON public.shops(user_id);
CREATE INDEX idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_products_shop_id ON public.products(shop_id);
CREATE INDEX idx_customers_shop_id ON public.customers(shop_id);
CREATE INDEX idx_conversations_user_id ON public.conversations(user_id);
CREATE INDEX idx_conversations_shop_id ON public.conversations(shop_id);
CREATE INDEX idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);
CREATE INDEX idx_webhook_logs_user_id ON public.webhook_logs(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON public.shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Shops policies
CREATE POLICY "Users can view own shops" ON public.shops FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own shops" ON public.shops FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own shops" ON public.shops FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own shops" ON public.shops FOR DELETE USING (auth.uid() = user_id);

-- Orders policies
CREATE POLICY "Users can view orders from own shops" ON public.orders FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert orders to own shops" ON public.orders FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update orders from own shops" ON public.orders FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Products policies
CREATE POLICY "Users can view products from own shops" ON public.products FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert products to own shops" ON public.products FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update products from own shops" ON public.products FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Customers policies
CREATE POLICY "Users can view customers from own shops" ON public.customers FOR SELECT USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert customers to own shops" ON public.customers FOR INSERT WITH CHECK (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update customers from own shops" ON public.customers FOR UPDATE USING (
    shop_id IN (SELECT id FROM public.shops WHERE user_id = auth.uid())
);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view messages from own conversations" ON public.messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);
CREATE POLICY "Users can insert messages to own conversations" ON public.messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM public.conversations WHERE user_id = auth.uid())
);

-- Refresh tokens policies
CREATE POLICY "Users can view own refresh tokens" ON public.refresh_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own refresh tokens" ON public.refresh_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own refresh tokens" ON public.refresh_tokens FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own refresh tokens" ON public.refresh_tokens FOR DELETE USING (auth.uid() = user_id);

-- Webhook logs policies
CREATE POLICY "Users can view own webhook logs" ON public.webhook_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own webhook logs" ON public.webhook_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
