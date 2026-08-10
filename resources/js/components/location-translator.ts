



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