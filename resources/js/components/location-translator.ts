



export default function LocationTranslator(locName:string){
    switch (locName){
        case 'warehouse':
            return 'ګودام';
        case 'factory':
            return 'کارخانه'
        case 'shop':
            return 'دوکان'
        case 'office':
            return 'دفتر شهر'
        default:
           return 'دیګر'
    }
}

export     const locationColor = (locName:string) => `${locName === 'warehouse' ? 'text-red-500': locName === 'factory' ? 'text-blue-500' : locName === 'shop' ? 'text-green-500' : 'text-yellow-500'} `;
