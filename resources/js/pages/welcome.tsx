
import HeroSection from '@/components/hero-section';
import { SectionTitle } from '@/components/section-title';
import GuestLayout from '@/layouts/guest-layout';
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"
import { Card, CardContent } from '@/components/ui/card';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    const heroBackgrounds = useMemo(
        () => [
            'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=90',
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=90',
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=90',
            'https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&w=1600&q=90',
            'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=1600&q=90',
            'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=1600&q=90',
        ],
        []
    );


    return (
        <>
            <GuestLayout>
                {/* =============== HERO SECTION =============== */}
                <HeroSection />
                <div className="p-4">
                    {/*--------------- Featured Prdocuts --------- */}
                    <section className="section">
                        <SectionTitle title="Featured Products" description="The most valuable and desired products." />
                        <div>
                            <div className="flex flex-col justify-center items-center w-full mt-12">
                                <Carousel
                                    opts={{
                                        align: "start",
                                        loop: true,
                                    }}
                                   
                                    className="w-full max-w-70 sm:max-w-xl md:max-w-3xl"
                                >
                                    <CarouselContent>
                                        {heroBackgrounds.map((url, index) => (
                                            <CarouselItem key={index} className=" md:basis-1/2 lg:basis-1/3 ">
                                                <div className="p-0 relative">
                                                    <Card className="overflow-hidden p-0" id="card">
                                                        <CardContent className="flex aspect-square px-0 justify-center">
                                                            {/* <span className="text-3xl font-semibold">{index + 1}</span> */}
                                                            <img src={url} alt="background image" className="inset-0 bg-cover bg-center" />
                                                        </CardContent>
                                                    </Card>
                                                    <Button className="absolute bottom-2 text-end w-full" variant={"link"} >Read more...</Button>
                                                </div>
                                            </CarouselItem>
                                        ))}
                                    </CarouselContent>
                                    <CarouselPrevious />
                                    <CarouselNext />
                                </Carousel>
                            </div>
                        </div>
                    </section>
                </div>
            </GuestLayout>
        </>
    );
}
