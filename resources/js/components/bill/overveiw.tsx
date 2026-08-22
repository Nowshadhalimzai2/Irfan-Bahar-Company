import React from 'react'
interface Props {
    children: React.ReactNode;
    className?: string;
}
const Overview = ({ children, className = '' }: Props) => {
    return (
        <div className={`flex font-medium justify-between items-center mt-5 px-4 ${className}`}>
            {children}
        </div>
    )
}

export default Overview