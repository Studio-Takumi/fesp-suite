import { Hero } from '~/components/hero'
import { ScrollSection } from '~/components/scroll-section'

export default function LandingPage() {
    return (
        <>
            <header className='border-b border-border'>
                <div className='mx-auto flex h-16 max-w-5xl items-center px-6 font-bold'>LPサイト</div>
            </header>

            <main>
                <Hero />
                <ScrollSection />
            </main>

            <footer className='border-t border-border py-10 text-center text-sm text-muted-foreground'>
                © {new Date().getFullYear()}
            </footer>
        </>
    )
}
