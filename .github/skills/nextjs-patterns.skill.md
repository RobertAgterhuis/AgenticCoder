# Next.js Patterns Skill

**Next.js 14+ App Router, Server Components, and Modern Patterns**

**Version**: 1.0  
**Category**: Full-Stack Framework  
**Related Agents**: @nextjs-specialist, @frontend-specialist

---

## Skill Overview

This skill covers Next.js 14+ patterns including App Router, React Server Components, Server Actions, streaming, caching strategies, and production optimization.

---

## Core Concepts

### 1. App Router Structure

#### Directory Convention
```
app/
├── layout.tsx              # Root layout (required)
├── page.tsx                # Home route (/)
├── loading.tsx             # Loading UI
├── error.tsx               # Error boundary
├── not-found.tsx           # 404 page
├── template.tsx            # Re-renders on navigation
├── (group)/                # Route group (no URL segment)
│   └── page.tsx
├── folder/
│   ├── page.tsx           # /folder
│   └── [slug]/            # Dynamic segment
│       └── page.tsx       # /folder/:slug
├── [...slug]/              # Catch-all segment
│   └── page.tsx           # /anything/here/works
├── [[...slug]]/            # Optional catch-all
│   └── page.tsx           # / or /anything/here
└── @modal/                 # Parallel route (slot)
    └── page.tsx
```

### 2. Server Components (Default)

#### Data Fetching in Server Components
```tsx
// app/products/page.tsx
// This is a Server Component by default

interface Product {
  id: string
  name: string
  price: number
}

async function getProducts(): Promise<Product[]> {
  const res = await fetch('https://api.example.com/products', {
    cache: 'force-cache' // Default: cache indefinitely
    // cache: 'no-store' // Never cache
    // next: { revalidate: 3600 } // Revalidate every hour
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch products')
  }
  
  return res.json()
}

export default async function ProductsPage() {
  const products = await getProducts()
  
  return (
    <main>
      <h1>Products</h1>
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - ${product.price}
          </li>
        ))}
      </ul>
    </main>
  )
}
```

#### Multiple Parallel Requests
```tsx
export default async function DashboardPage() {
  // Parallel data fetching - much faster!
  const [user, posts, analytics] = await Promise.all([
    getUser(),
    getPosts(),
    getAnalytics()
  ])

  return (
    <div>
      <UserProfile user={user} />
      <PostsList posts={posts} />
      <AnalyticsDashboard data={analytics} />
    </div>
  )
}
```

### 3. Client Components

#### When to Use Client Components
```tsx
// components/counter.tsx
'use client' // Must be at the top

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  )
}
```

#### Client Component with Server Data
```tsx
// app/products/page.tsx (Server Component)
import { ProductList } from '@/components/product-list'

export default async function ProductsPage() {
  const products = await getProducts() // Server-side fetch
  
  return (
    <ProductList initialProducts={products} />
  )
}

// components/product-list.tsx (Client Component)
'use client'

import { useState } from 'react'

interface Props {
  initialProducts: Product[]
}

export function ProductList({ initialProducts }: Props) {
  const [products, setProducts] = useState(initialProducts)
  const [filter, setFilter] = useState('')
  
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <div>
      <input 
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search products..."
      />
      <ul>
        {filtered.map(product => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

### 4. Server Actions

#### Form Server Action
```tsx
// app/actions.ts
'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const CreatePostSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string().min(10, 'Content must be at least 10 characters')
})

export type CreatePostState = {
  errors?: {
    title?: string[]
    content?: string[]
    _form?: string[]
  }
  success?: boolean
}

export async function createPost(
  prevState: CreatePostState,
  formData: FormData
): Promise<CreatePostState> {
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content')
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors
    }
  }

  try {
    await db.post.create({
      data: validatedFields.data
    })
  } catch (error) {
    return {
      errors: {
        _form: ['Database error. Please try again.']
      }
    }
  }

  revalidatePath('/posts')
  redirect('/posts')
}
```

#### Using Server Action with useFormState
```tsx
// components/create-post-form.tsx
'use client'

import { useFormState, useFormStatus } from 'react-dom'
import { createPost, type CreatePostState } from '@/app/actions'

const initialState: CreatePostState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export function CreatePostForm() {
  const [state, formAction] = useFormState(createPost, initialState)

  return (
    <form action={formAction}>
      {state.errors?._form && (
        <div className="error">{state.errors._form}</div>
      )}
      
      <div>
        <label htmlFor="title">Title</label>
        <input id="title" name="title" required />
        {state.errors?.title && (
          <span className="error">{state.errors.title}</span>
        )}
      </div>

      <div>
        <label htmlFor="content">Content</label>
        <textarea id="content" name="content" required />
        {state.errors?.content && (
          <span className="error">{state.errors.content}</span>
        )}
      </div>

      <SubmitButton />
    </form>
  )
}
```

#### Non-Form Server Action
```tsx
// app/actions.ts
'use server'

import { revalidateTag } from 'next/cache'

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } })
  revalidateTag('posts')
}

export async function likePost(postId: string) {
  await db.post.update({
    where: { id: postId },
    data: { likes: { increment: 1 } }
  })
  revalidateTag(`post-${postId}`)
}

// Usage in Client Component
'use client'

import { useTransition } from 'react'
import { deletePost } from '@/app/actions'

export function DeleteButton({ postId }: { postId: string }) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(() => deletePost(postId))}
      disabled={isPending}
    >
      {isPending ? 'Deleting...' : 'Delete'}
    </button>
  )
}
```

### 5. Streaming and Suspense

#### Streaming with Suspense
```tsx
// app/dashboard/page.tsx
import { Suspense } from 'react'
import { UserProfile } from '@/components/user-profile'
import { RecentPosts } from '@/components/recent-posts'
import { Analytics } from '@/components/analytics'
import { Skeleton } from '@/components/ui/skeleton'

export default function DashboardPage() {
  return (
    <main>
      <h1>Dashboard</h1>
      
      {/* Each Suspense boundary streams independently */}
      <Suspense fallback={<Skeleton className="h-32" />}>
        <UserProfile />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-64" />}>
        <RecentPosts />
      </Suspense>
      
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Analytics />
      </Suspense>
    </main>
  )
}
```

#### Loading UI Convention
```tsx
// app/dashboard/loading.tsx
// Automatically wraps page.tsx in Suspense

export default function DashboardLoading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded mb-4" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 bg-gray-200 rounded" />
        ))}
      </div>
    </div>
  )
}
```

### 6. Caching Strategies

#### Fetch Cache Options
```tsx
// Default: cache forever (static)
fetch(url)
fetch(url, { cache: 'force-cache' })

// Never cache (dynamic)
fetch(url, { cache: 'no-store' })

// Time-based revalidation (ISR)
fetch(url, { next: { revalidate: 3600 } }) // 1 hour

// Tag-based revalidation
fetch(url, { next: { tags: ['posts'] } })
```

#### unstable_cache for Functions
```tsx
import { unstable_cache } from 'next/cache'

const getCachedUser = unstable_cache(
  async (userId: string) => {
    const user = await db.user.findUnique({
      where: { id: userId }
    })
    return user
  },
  ['user'], // Key prefix
  {
    tags: ['users'], // Cache tags
    revalidate: 3600 // Revalidate after 1 hour
  }
)

// Usage
const user = await getCachedUser('123')
```

#### Revalidation
```tsx
// On-demand revalidation in Server Action
'use server'

import { revalidatePath, revalidateTag } from 'next/cache'

export async function updatePost(id: string, data: PostData) {
  await db.post.update({ where: { id }, data })
  
  // Revalidate specific path
  revalidatePath('/posts')
  revalidatePath(`/posts/${id}`)
  
  // Or revalidate by tag
  revalidateTag('posts')
  revalidateTag(`post-${id}`)
}
```

### 7. Metadata and SEO

#### Static Metadata
```tsx
// app/about/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn more about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn more about our company',
    images: ['/og-about.png']
  }
}

export default function AboutPage() {
  return <main>...</main>
}
```

#### Dynamic Metadata
```tsx
// app/posts/[id]/page.tsx
import type { Metadata, ResolvingMetadata } from 'next'

type Props = {
  params: { id: string }
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const post = await getPost(params.id)
  
  // Optionally access parent metadata
  const previousImages = (await parent).openGraph?.images || []

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [post.image, ...previousImages]
    }
  }
}

export default async function PostPage({ params }: Props) {
  const post = await getPost(params.id)
  return <article>...</article>
}
```

### 8. Route Handlers (API Routes)

#### RESTful Route Handler
```tsx
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '10')

  const posts = await db.post.findMany({
    skip: (page - 1) * limit,
    take: limit
  })

  return NextResponse.json({ posts, page, limit })
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const post = await db.post.create({ data: body })
  
  return NextResponse.json(post, { status: 201 })
}
```

#### Dynamic Route Handler
```tsx
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'

type Context = {
  params: { id: string }
}

export async function GET(
  request: NextRequest,
  { params }: Context
) {
  const post = await db.post.findUnique({
    where: { id: params.id }
  })

  if (!post) {
    return NextResponse.json(
      { error: 'Post not found' },
      { status: 404 }
    )
  }

  return NextResponse.json(post)
}

export async function DELETE(
  request: NextRequest,
  { params }: Context
) {
  await db.post.delete({
    where: { id: params.id }
  })

  return new NextResponse(null, { status: 204 })
}
```

### 9. Middleware

#### Authentication Middleware
```tsx
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const publicPaths = ['/', '/login', '/register', '/api/public']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  )

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for auth token
  const token = request.cookies.get('auth-token')?.value

  if (!token) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)'
  ]
}
```

### 10. Parallel and Intercepting Routes

#### Parallel Routes (Modals)
```
app/
├── @modal/
│   ├── default.tsx         # Fallback when no modal
│   └── (.)post/[id]/
│       └── page.tsx        # Intercepts /post/:id
├── layout.tsx
└── page.tsx
```

```tsx
// app/layout.tsx
export default function RootLayout({
  children,
  modal
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <html>
      <body>
        {children}
        {modal}
      </body>
    </html>
  )
}

// app/@modal/default.tsx
export default function Default() {
  return null
}

// app/@modal/(.)post/[id]/page.tsx
import { Modal } from '@/components/modal'

export default async function PostModal({ 
  params 
}: { 
  params: { id: string } 
}) {
  const post = await getPost(params.id)
  
  return (
    <Modal>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
    </Modal>
  )
}
```

---

## Anti-Patterns

### ❌ Don't: Use useEffect for Data Fetching
```tsx
// BAD: Client-side data fetching when not needed
'use client'

export function Posts() {
  const [posts, setPosts] = useState([])
  
  useEffect(() => {
    fetch('/api/posts')
      .then(res => res.json())
      .then(setPosts)
  }, [])
  
  return <PostList posts={posts} />
}
```

### ✅ Do: Fetch in Server Components
```tsx
// GOOD: Server-side data fetching
export default async function Posts() {
  const posts = await getPosts()
  return <PostList posts={posts} />
}
```

### ❌ Don't: Import Server-Only Code in Client Components
```tsx
'use client'
// BAD: Importing server-only module
import { db } from '@/lib/db' // Will error!
```

### ✅ Do: Keep Server Code in Server Components
```tsx
// Server Component
import { db } from '@/lib/db'

export default async function Page() {
  const data = await db.query()
  return <ClientComponent data={data} />
}
```

### ❌ Don't: Nest Client Components in Server Components
```tsx
// BAD: Client component wrapping server component
'use client'

export function ClientWrapper({ children }) {
  return <div onClick={...}>{children}</div>
}

// This won't work as expected:
<ClientWrapper>
  <ServerComponent /> {/* Becomes client component! */}
</ClientWrapper>
```

### ✅ Do: Use Composition Pattern
```tsx
// GOOD: Pass server components as children
// Server Component
export default function Page() {
  return (
    <ClientWrapper>
      <ServerComponent />
    </ClientWrapper>
  )
}
```

---

## Quick Reference

### File Conventions
| File | Purpose |
|------|---------|
| `page.tsx` | Unique route UI |
| `layout.tsx` | Shared layout |
| `loading.tsx` | Loading state |
| `error.tsx` | Error boundary |
| `not-found.tsx` | 404 page |
| `route.ts` | API endpoint |

### Data Fetching
| Method | When to Use |
|--------|-------------|
| Server Component fetch | Static/ISR data |
| `cache: 'no-store'` | Dynamic data |
| `unstable_cache` | Database queries |
| Client-side | User interactions |

### Revalidation
| Method | Use Case |
|--------|----------|
| `revalidatePath()` | Specific route |
| `revalidateTag()` | Tagged data |
| `next: { revalidate: n }` | Time-based |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
