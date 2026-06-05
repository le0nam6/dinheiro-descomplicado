interface Post {
  title: string
  slug: { current: string }
  publishedAt: string
  funnel: 'tofu' | 'mofu' | 'bofu'
  category: string
  excerpt: string
  coverImage?: { url: string; alt: string }
  readingTime?: number
}

export function PostCard({ post }: { post: Post }) {
  const date = new Date(post.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })

  return (
    <article className="group border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow bg-white">
      {post.coverImage?.url && (
        <a href={`/blog/${post.slug.current}`}>
          <img
            src={post.coverImage.url}
            alt={post.coverImage.alt}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </a>
      )}
      <div className="p-5">
        <span className="text-xs text-green-700 font-semibold capitalize">{post.category}</span>
        <a href={`/blog/${post.slug.current}`}>
          <h2 className="font-bold text-gray-900 text-lg mt-1 mb-2 group-hover:text-green-700 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </a>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4">{post.excerpt}</p>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{date}</span>
          {post.readingTime && <span>{post.readingTime} min de leitura</span>}
        </div>
      </div>
    </article>
  )
}
