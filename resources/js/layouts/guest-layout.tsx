import { CompanyTitle } from '@/components/company-title';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { login, logout, register } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import { BriefcaseConveyorBeltIcon, Facebook, Instagram, Menu, MessageCircle, Music2, Phone, PhoneCall, User } from 'lucide-react';
import React, { useEffect, useState } from 'react'
interface GuestLayoutProps {
    children: React.ReactNode;
}
type LinkType = { name: string; url: string; }
const links: LinkType[] = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    { name: "Contact Us", url: "/contact-us" },
    { name: "About Us", url: "/about-us" },

]
const GuestLayout = ({ children }: GuestLayoutProps) => {
    const [screenWdith, setScreenWidth] = useState<number>(window.innerWidth);
    const { props: { auth }, url } = usePage();
    const socialLinks = [
        { name: 'WhatsApp', href: 'https://wa.me/782641141', icon: Phone },
        { name: 'Instagram', href: 'https://www.instagram.com/', icon: Instagram },
        { name: 'Facebook', href: 'https://www.facebook.com/', icon: Facebook },
        { name: 'TikTok', href: 'https://www.tiktok.com/', icon: Music2 },
    ];
    useEffect(() => {
        setScreenWidth(() => window.innerWidth);

    }, [window.innerWidth]);


    return (
        <div className=" dark:bg-accent-foreground">
            <header className="border-b border-secondary px-4 shadow py-4">
                <nav className="flex justify-between items-center">
                    {/* LOGO appears here */}
                    <CompanyTitle />
                    {screenWdith >= 620
                        //  ===================== FOR LARAGER SCREENS MENU BAR =========
                        ? <div className="Large Screen MenuBar flex justify-between items-center w-3/4">
                            <div className="Quick_Links flex items-center gap-8">
                                {links.map((link) =>
                                    <Link href={link.url} className={` font-semibold hover:text-accent-foreground ${link.url === url ? "text-accent" : "text-secondary-foreground"}`}>{link.name}</Link>
                                )}
                            </div>
                            {auth.user
                                ?
                                <div className="Auth flex gap-2">
                                    <Link href={logout()}><Button>Log out</Button></Link>
                                </div>
                                : <div className="Auth flex gap-2">
                                    <Link href={login()}><Button>Log in</Button></Link>
                                    <Link href={register()}><Button>Sign up</Button></Link>
                                </div>
                            }
                        </div>
                        // =================== FOR SMALL SCREENS (MOBILE SIZES)  =================
                        : <div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant={"ghost"} className="dark:bg-accent-foreground ">
                                        <Menu className="text-accent-foreground dark:text-foreground size-7" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    {/* small screen menu items  */}
                                    <div className="flex flex-col divide-accent gap-4">
                                        {links.map((link) =>
                                            <Link href={link.url} className={` font-semibold hover:text-accent ${link.url === url ? "text-accent" : "text-primary"}`}>{link.name}</Link>
                                        )}
                                        {auth.user ?
                                            <Link href={logout()} className="text-start bg-red-50 p-1.5 border-red-100 rounded-sm text-red-500 border">Log out</Link>
                                            :
                                            <>
                                                <Link className="text-start bg-green-50 p-1.5 border-green-100 rounded-sm text-green-500 border" href={login()}>Log in</Link>
                                                <Link className="text-start bg-yellow-50 p-1.5 border-yellow-100 rounded-sm text-yellow-500 border" href={register()}>Sign up</Link>
                                            </>
                                        }

                                    </div>
                                    <DialogFooter className="gap-2">
                                        <p className="text-muted-foreground text-sm">All rights reserves. copywrite@2009</p>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>}
                </nav>
            </header>
            <main className="min-h-screen mx-auto ">
                {children}
            </main>
            <footer className="py-6 px-4 bg-foreground rounded-sm">
                <div className="mx-auto flex flex-col py-4">
                    <div className="px-4 mb-3">
                        <CompanyTitle />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 place-items-center gap-y-5 md:gap-y-0 px-5 items-center text-secondary">
                        <div className="">
                            <h4 className="font-semibold text-accent mb-2 text-center md:mb-4">Quick Links</h4>
                            <div className="flex  flex-col gap-3 justify-center items-center text-secondary ">
                                <Link className="" href={'/'}>Home </Link>
                                <Link className="" href={'/products'}>Product </Link>
                                <Link className="" href={'/contact-us'}>Contact us </Link>
                                <Link className="" href={'/about-us'}>About us</Link>
                            </div>
                        </div>
                        <div className="">
                            <h4 className="font-semibold text-accent mb-2 text-center md:mb-4">Follow us</h4>
                            <div className="flex flex-col gap-3 justify-center items-center text-secondary ">
                                {socialLinks.map(({ name, href, icon: Icon }) => (
                                    <a
                                        key={name}
                                        href={href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 hover:text-accent transition-colors"
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span>{name}</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div className="">
                            <h4 className="font-semibold text-accent text-center mb-2 md:mb-4">Contact Developer</h4>
                            <div className="flex flex-col gap-3 justify-center items-center text-secondary ">
                                <div className="flex items-center gap-1 flex-col">
                                    <div className=" rounded-full border w-fit p-2 border-secondary">
                                        <User className="size-6" />
                                    </div>
                                    <p className="text-secondary text-sm">nowshadhalimzai@gmail.com</p>
                                </div>
                                <div className="flex gap-2"><Phone className="" /> <span>+93-782-641-141</span></div>
                                <Link href={"#"} className="flex gap-2"><BriefcaseConveyorBeltIcon className="" /> <span>Portfolio</span></Link>


                            </div>
                        </div>
                    </div>
                </div>
                <div className="CopyWriter flex justify-center">
                    <p className="text-muted-foreground text-sm">All rights reserved. copyright © 2009</p>
                </div>
            </footer>
        </div>
    )
}

export default GuestLayout