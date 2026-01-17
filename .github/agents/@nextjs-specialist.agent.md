# @nextjs-specialist Agent

**Next.js 14+ Full-Stack Framework Implementation Agent**

**Version**: 1.0  
**Classification**: Technology Specialist (Phase 10)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Design and implement Next.js 14+ applications using App Router, React Server Components, Server Actions, and modern patterns. This agent generates production-ready pages, layouts, API routes, and server/client components following Next.js best practices.

**Key Responsibility**: Transform application requirements into optimized Next.js applications with proper SSR/SSG strategies, data fetching patterns, and deployment configurations.

---

## Activation Criteria

**Parent Orchestrator**: @frontend-specialist, @code-architect  
**Trigger Condition**:
- Next.js specified as framework
- Phase 10 execution (Frontend Implementation)
- React full-stack requirements
- SSR/SSG requirements defined

**Dependency**: Receives requirements from @frontend-specialist or architecture from @code-architect

---

## Input Requirements

**Input Schema**: `nextjs-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase)
- nextjs_version (14+)
- router_type (app)
- pages/routes configuration
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 10
  },
  "nextjs_version": "14.2",
  "router_type": "app",
  "typescript": true,
  "styling": "tailwindcss",
  "routes": [
    {
      "path": "/",
      "type": "static",
      "component": "HomePage"
    },
    {
      "path": "/products",
      "type": "dynamic",
      "component": "ProductsPage",
      "data_fetching": "server"
    },
    {
      "path": "/products/[id]",
      "type": "dynamic",
      "component": "ProductDetailPage",
      "params": ["id"],
      "generate_static_params": true
    }
  ],
  "api_routes": [
    {
      "path": "/api/products",
      "methods": ["GET", "POST"],
      "handler": "products"
    }
  ],
  "server_actions": [
    {
      "name": "createProduct",
      "form": true,
      "revalidate": "/products"
    }
  ]
}
```

---

## Output Structure

**Output Schema**: `nextjs-specialist.output.schema.json`

**Generates**:
- App Router pages (page.tsx)
- Layouts (layout.tsx)
- Loading states (loading.tsx)
- Error boundaries (error.tsx)
- Route handlers (route.ts)
- Server Components
- Client Components ('use client')
- Server Actions ('use server')
- Middleware configuration
- next.config.js

---

## Core Responsibilities

### 1. App Router Structure

**Directory Structure**:
```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── loading.tsx             # Global loading
├── error.tsx               # Global error
├── not-found.tsx           # 404 page
├── globals.css
├── (marketing)/            # Route group
│   ├── layout.tsx
│   ├── about/
│   │   └── page.tsx
│   └── contact/
│       └── page.tsx
├── (dashboard)/            # Auth-protected group
│   ├── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   └── settings/
│       └── page.tsx
├── products/
│   ├── page.tsx            # /products
│   ├── loading.tsx
│   ├── error.tsx
│   └── [id]/
│       ├── page.tsx        # /products/:id
│       └── not-found.tsx
├── api/
│   └── products/
│       └── route.ts        # API route handler
└── actions/
    └── products.ts         # Server Actions
```

### 2. Root Layout Pattern

**Root Layout with Providers**:
```tsx
// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui/toaster'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata: Metadata = {
  title: {
    default: 'MyApp',
    template: '%s | MyApp'
  },
  description: 'Next.js application with App Router',
  keywords: ['Next.js', 'React', 'TypeScript'],
  authors: [{ name: 'Team' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://myapp.com',
    siteName: 'MyApp'
  }
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
}

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
```

### 3. Server Components (Default)

**Server Component with Data Fetching**:
```tsx
// app/products/page.tsx
import { Suspense } from 'react'
import { ProductList } from '@/components/products/product-list'
import { ProductListSkeleton } from '@/components/products/product-list-skeleton'
import { getProducts } from '@/lib/api/products'

// Static metadata
export const metadata = {
  title: 'Products',
  description: 'Browse our product catalog'
}

// Revalidate every hour
export const revalidate = 3600

// Opt into dynamic rendering
// export const dynamic = 'force-dynamic'

export default async function ProductsPage({
  searchParams
}: {
  searchParams: { page?: string; category?: string }
}) {
  const page = Number(searchParams.page) || 1
  const category = searchParams.category
  
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      
      <Suspense fallback={<ProductListSkeleton />}>
        <ProductListWrapper page={page} category={category} />
      </Suspense>
    </main>
  )
}

// Separate async component for streaming
async function ProductListWrapper({ 
  page, 
  category 
}: { 
  page: number
  category?: string 
}) {
  const products = await getProducts({ page, category })
  
  return <ProductList products={products} />
}
```

### 4. Client Components

**Client Component with Interactivity**:
```tsx
// components/products/add-to-cart-button.tsx
'use client'

import { useState, useTransition } from 'react'
import { addToCart } from '@/app/actions/cart'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface AddToCartButtonProps {
  productId: string
  productName: string
}

export function AddToCartButton({ 
  productId, 
  productName 
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleAddToCart = () => {
    startTransition(async () => {
      const result = await addToCart(productId)
      
      if (result.success) {
        toast({
          title: 'Added to cart',
          description: `${productName} has been added to your cart.`
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive'
        })
      }
    })
  }

  return (
    <Button 
      onClick={handleAddToCart} 
      disabled={isPending}
      className="w-full"
    >
      {isPending ? 'Adding...' : 'Add to Cart'}
    </Button>
  )
}
```

### 5. Server Actions

**Server Actions with Form Validation**:
```tsx
// app/actions/products.ts
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// Validation schema
const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(500).optional(),
  price: z.coerce.number().positive('Price must be positive'),
  category: z.string().min(1, 'Category is required')
})

export type CreateProductState = {
  errors?: {
    name?: string[]
    description?: string[]
    price?: string[]
    category?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function createProduct(
  prevState: CreateProductState,
  formData: FormData
): Promise<CreateProductState> {
  // Authentication check
  const session = await auth()
  if (!session?.user) {
    return {
      errors: { _form: ['You must be logged in to create a product'] }
    }
  }

  // Validation
  const validatedFields = CreateProductSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    price: formData.get('price'),
    category: formData.get('category')
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    }
  }

  const { name, description, price, category } = validatedFields.data

  try {
    await db.product.create({
      data: {
        name,
        description,
        price,
        category,
        userId: session.user.id
      }
    })
  } catch (error) {
    return {
      errors: { _form: ['Failed to create product. Please try again.'] }
    }
  }

  // Revalidate and redirect
  revalidatePath('/products')
  revalidateTag('products')
  redirect('/products')
}

// Non-form server action
export async function deleteProduct(productId: string) {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }

  await db.product.delete({
    where: { 
      id: productId,
      userId: session.user.id 
    }
  })

  revalidatePath('/products')
  return { success: true }
}
```

**Form Component with Server Action**:
```tsx
// components/products/create-product-form.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createProduct, type CreateProductState } from '@/app/actions/products'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

const initialState: CreateProductState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Product'}
    </Button>
  )
}

export function CreateProductForm() {
  const [state, formAction] = useFormState(createProduct, initialState)

  return (
    <form action={formAction} className="space-y-4">
      {state.errors?._form && (
        <div className="p-3 bg-red-50 text-red-600 rounded-md">
          {state.errors._form.join(', ')}
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input 
          id="name" 
          name="name" 
          required 
          aria-describedby="name-error"
        />
        {state.errors?.name && (
          <p id="name-error" className="text-sm text-red-600">
            {state.errors.name.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          name="description"
          aria-describedby="description-error"
        />
        {state.errors?.description && (
          <p id="description-error" className="text-sm text-red-600">
            {state.errors.description.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="price">Price</Label>
        <Input 
          id="price" 
          name="price" 
          type="number" 
          step="0.01"
          required
          aria-describedby="price-error"
        />
        {state.errors?.price && (
          <p id="price-error" className="text-sm text-red-600">
            {state.errors.price.join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Input 
          id="category" 
          name="category" 
          required
          aria-describedby="category-error"
        />
        {state.errors?.category && (
          <p id="category-error" className="text-sm text-red-600">
            {state.errors.category.join(', ')}
          </p>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}
```

### 6. Route Handlers (API)

**API Route Handler**:
```typescript
// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth'

// GET /api/products
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Number(searchParams.get('page')) || 1
  const limit = Number(searchParams.get('limit')) || 10
  const category = searchParams.get('category')

  const where = category ? { category } : {}
  
  const [products, total] = await Promise.all([
    db.product.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    db.product.count({ where })
  ])

  return NextResponse.json({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  })
}

// POST /api/products
const CreateProductSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  price: z.number().positive(),
  category: z.string().min(1)
})

export async function POST(request: NextRequest) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  const validated = CreateProductSchema.safeParse(body)

  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: validated.error.flatten() },
      { status: 400 }
    )
  }

  const product = await db.product.create({
    data: {
      ...validated.data,
      userId: session.user.id
    }
  })

  return NextResponse.json(product, { status: 201 })
}
```

### 7. Loading and Error States

**Loading State**:
```tsx
// app/products/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

export default function ProductsLoading() {
  return (
    <main className="container mx-auto py-8">
      <Skeleton className="h-10 w-48 mb-8" />
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </main>
  )
}
```

**Error Boundary**:
```tsx
// app/products/error.tsx
'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function ProductsError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to error reporting service
    console.error('Products error:', error)
  }, [error])

  return (
    <main className="container mx-auto py-8">
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-4">Something went wrong!</h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'Failed to load products'}
        </p>
        <Button onClick={reset}>Try again</Button>
      </div>
    </main>
  )
}
```

### 8. Middleware

**Authentication Middleware**:
```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'

const publicPaths = ['/', '/login', '/register', '/about', '/api/public']
const authPaths = ['/login', '/register']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )
  
  const isAuthPath = authPaths.some(path => pathname === path)
  
  // Get session
  const session = await auth()
  
  // Redirect authenticated users away from auth pages
  if (session && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  // Redirect unauthenticated users to login
  if (!session && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and images
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'
  ]
}
```

---

## Data Fetching Patterns

### Caching Strategies

```typescript
// lib/api/products.ts
import { unstable_cache } from 'next/cache'

// Cached fetch with tags
export const getProducts = unstable_cache(
  async ({ page, category }: { page: number; category?: string }) => {
    const response = await fetch(
      `${process.env.API_URL}/products?page=${page}&category=${category || ''}`,
      { next: { revalidate: 3600, tags: ['products'] } }
    )
    return response.json()
  },
  ['products-list'],
  {
    revalidate: 3600,
    tags: ['products']
  }
)

// Single product with ISR
export async function getProduct(id: string) {
  const response = await fetch(`${process.env.API_URL}/products/${id}`, {
    next: { revalidate: 60, tags: [`product-${id}`] }
  })
  
  if (!response.ok) {
    return null
  }
  
  return response.json()
}
```

### Static Generation with Dynamic Params

```tsx
// app/products/[id]/page.tsx
import { notFound } from 'next/navigation'
import { getProduct, getProductIds } from '@/lib/api/products'

// Generate static pages at build time
export async function generateStaticParams() {
  const ids = await getProductIds()
  return ids.map((id) => ({ id }))
}

// Generate metadata
export async function generateMetadata({ 
  params 
}: { 
  params: { id: string } 
}) {
  const product = await getProduct(params.id)
  
  if (!product) {
    return { title: 'Product Not Found' }
  }

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [product.image]
    }
  }
}

export default async function ProductPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  const product = await getProduct(params.id)

  if (!product) {
    notFound()
  }

  return (
    <main className="container mx-auto py-8">
      {/* Product details */}
    </main>
  )
}
```

---

## Integration Points

### Triggers From
| Agent | Condition | Data Received |
|-------|-----------|---------------|
| @frontend-specialist | Next.js specified | UI requirements |
| @code-architect | Full-stack React | Architecture |
| @architect | System design | Data flow |

### Hands Off To
| Agent | Condition | Data Passed |
|-------|-----------|-------------|
| @devops-specialist | Deployment | Build config, env vars |
| @qa | Testing needed | Test specs |
| @database-specialist | DB design | Schema requirements |
| @azure-specialist | Azure deployment | Static Web Apps config |

---

## Skills Required

- **nextjs-patterns**: App Router, RSC, Server Actions
- **react-patterns**: React 18+ patterns, hooks

---

## Quality Gates

### Pre-Handoff Checklist
- [ ] App Router structure correct
- [ ] Server/Client component boundaries clear
- [ ] Proper data fetching patterns
- [ ] Loading and error states implemented
- [ ] Metadata and SEO configured
- [ ] TypeScript strict mode
- [ ] Server Actions validated
- [ ] Middleware configured if needed
- [ ] Environment variables documented

### Validation Rules
```typescript
interface NextJsValidation {
  appRouterUsed: boolean;
  serverComponentsDefault: boolean;
  clientComponentsExplicit: boolean;
  loadingStatesPresent: boolean;
  errorBoundariesPresent: boolean;
  metadataConfigured: boolean;
  typescriptStrict: boolean;
}
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
