



export default function LocationTranslator(locName: string) {
    switch (locName) {
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

export const locationColor = (locName: string) => `${locName === 'warehouse' ? 'text-red-500' : locName === 'factory' ? 'text-blue-500' : locName === 'shop' ? 'text-green-500' : 'text-yellow-500'} `;
export const getDariItemType = (itemType: string) => itemType === 'product' ? 'جنس ' : itemType === 'raw_material' ? 'مواد خام' : itemType === 'packing' ? 'پیکنګ' : '';
export const getDariItemUnit = (unit: string) => {
    switch (unit.toLowerCase()) {
        case 'kg':
            return 'کیلو';
        case 'ltr':
            return 'لیتر';
        case 'gr':
            return 'ګرام';
        case 'packet':
            return 'پاکت';
        case 'bundle':
            return 'بسته';
        case 'unit':
            return 'دانه';
        case 'bag':
            return 'بوجی';
        case 'pair':
            return 'جوره';
        case 'carton':
            return 'کارتن';
        default:
            return 'واحداش مشخص نیست';
    }
}
export const getDariCurrency = (currency: string) => currency === 'AFG' ? 'افغانی' : currency === 'َUSD' ? 'دالر' : currency === 'PKR' ? 'کلداری' : '';
export const getUnitOfMeasureMents = () => [{value:'kg', label:'کیلو'} , {value: 'gr', label:'ګرام'} , {value:'ltr',label:'لیتر'} , {value:'packet',label:'پاکت'} , {value:'carton', label:'کارتن'} , {value:'bundle', label:'بسته'} , {value:'pair',label:'جوره'} , {value:'unit', label:'دانه'} , {value:'bag',label:'بوجی'}];
