import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
    return [
        {
            url: 'https://test.ratkin.org',
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        },
        {
            url: 'https://test.ratkin.org/test/intro',
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: 'https://test.ratkin.org/result',
            lastModified: new Date(),
            changeFrequency: 'always',
            priority: 0.5,
        },
    ]
}
