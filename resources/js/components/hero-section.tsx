import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const HeroSection = () => {

    const heroBackgrounds = useMemo(
        () => [
            'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=80',
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=80',
        ],
        []
    );

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        heroBackgrounds.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    }, [heroBackgrounds]);

    useEffect(() => {
        if (!heroBackgrounds.length) {
            return;
        }

        const interval = window.setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % heroBackgrounds.length);
        }, 5000);

        return () => window.clearInterval(interval);
    }, [heroBackgrounds.length]);

    return (
        <section id="Hero Section" className="relative overflow-hidden p-0 mb-0 bg-slate-950 text-white shadow-2xl shadow-slate-950/20">
            <div className="pointer-events-none absolute inset-0">
                {heroBackgrounds.map((background, index) => (
                    <div
                        key={background}
                        className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out ${index === currentSlide
                                ? 'opacity-100 translate-y-0 z-10'
                                : 'opacity-0 -translate-y-8 z-0'
                            }`}
                        style={{ backgroundImage: `url(${background})` }}
                    />
                ))}
                <div className="absolute inset-0 bg-linear-to-br from-slate-950/85 via-slate-950/40 to-slate-950/85" />
            </div>

            <div className="relative mx-auto max-w-6xl min-h-[72vh] py-24 px-4 sm:px-6 lg:px-8 z-10">
                <div className="flex min-h-[48vh] flex-col items-center justify-center text-center">
                    <h1 className="text-6xl font-semibold text-accent sm:text-5xl md:text-6xl lg:text-7xl">
                        <span className="font-serif">Be Spotless,</span>{' '}
                        <span className="font-mono">Be Bright</span>
                    </h1>
                    <p className="mt-5 max-w-3xl text-lg text-muted sm:text-xl">
                        Irfan Bahar detergent materials manufacturing and packing company.
                    </p>
                </div>
                {/* Call To Action */}
                <div className="flex justify-center items-center py-16">
                    <Link href="/contact-us">
                        <Button size="lg">Contact Us</Button>
                    </Link>
                </div>
            </div>
        </section>
    )
}

export default HeroSection