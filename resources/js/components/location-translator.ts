



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

export const locationColor = (locName:string) => `${locName === 'warehouse' ? 'text-red-500': locName === 'factory' ? 'text-blue-500' : locName === 'shop' ? 'text-green-500' : 'text-yellow-500'} `;
export const getDariItemType = (itemType:string) => itemType === 'product' ? 'جنس ': itemType === 'raw_material' ? 'مواد خام' : itemType === 'packing' ? 'پیکنګ' : '';
export const getDariItemUnit = (unit:string) => unit === 'kg' ? 'کیلو ': unit === 'ltr' ? 'لیتر' : unit === 'gr' ? 'ګرام' : '';
export const getDariCurrency = (currency:string) => currency === 'AFG' ? 'افغانی': currency === 'َUSD' ? 'دالر' : currency === 'PKR' ? 'کلداری' : '';
