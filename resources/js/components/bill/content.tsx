import React from 'react';

interface Props{
    children:React.ReactNode;
}
const Content = ({children}:Props) => {
    return (
        <div className="py-5 h-163 relative">
            {/* ======================= BACKGROUND TEXT ============= */}
            <h2 className="absolute top-60 left-30 text-6xl opacity-30 -rotate-45 font-bold text-primary">شرکت عرفان بهار</h2>
            <div>
                {children}
            </div>
        </div>
    )
}

export default Content