import React from 'react'

interface Props {
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
    className?:string;
}
const PageLinks = ({ links,className }: Props) => {
    return (
        <div className={`flex justify-center items-center space-x-2 ${className}`}>
            {links.map((link, index) => (
                <a
                    key={index}
                    href={link.url ?? '#'}
                    className={`px-3 py-1.5 border rounded ${link.active ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                >
                    {link.label.includes('Next') ? 'Next' : link.label.includes('Previous') ? 'Previous' : link.label}
                </a>
            ))}
        </div>
    )
}

export default PageLinks