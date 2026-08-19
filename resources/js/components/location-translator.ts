



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
        case 'other':
            return 'دیګر'
        default:
            return locName
    }
}

export const locationColor = (locName: string) => `${locName === 'warehouse' ? 'text-red-500' : locName === 'factory' ? 'text-blue-500' : locName === 'shop' ? 'text-green-500' : 'text-yellow-500'} `;
export const getDariItemType = (itemType: string) => itemType === 'product' ? 'محصول ' : itemType === 'raw_material' ? 'مواد خام' : itemType === 'packing' ? 'پیکنګ' : itemType;
export const getDariCategory = (category: string) => category === 'soap' ? 'صابون ' : category === 'powder' ? 'پودر' : category === 'shampoo' ? 'شامپو' : category === 'acid' ? 'تیزاب' : category === 'vaseline' ? 'واسلین' : category === 'raw_material' ? 'مواد خام' : category === 'packing' ? 'پیکینګ' : category;
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
            return unit;
    }
}
export const getDariCurrency = (currency: string) => currency === 'AFG' ? 'افغانی' : currency === 'َUSD' ? 'دالر' : currency === 'PKR' ? 'کلداری' : currency;
export const getUnitOfMeasurements = () => [{ value: 'kg', label: 'کیلو' }, { value: 'gr', label: 'ګرام' }, { value: 'ltr', label: 'لیتر' }, { value: 'packet', label: 'پاکت' }, { value: 'carton', label: 'کارتن' }, { value: 'bundle', label: 'بسته' }, { value: 'pair', label: 'جوره' }, { value: 'unit', label: 'دانه' }, { value: 'bag', label: 'بوجی' }];


export const getSingleUnitWeight = (weight: number, per_pack: number = 1) => (weight / per_pack).toFixed(3);
export const getDariOrderStatus = (status: string) => status === 'pending' ? 'انتظار ' : status === 'progress' ? 'جریان' : status === 'completed' ? 'تکمیل شده' : status === 'cancelled' ? 'لغو شده' : status === 'drafted' ? 'پیش نویس شده' : status;
export const getStatusColor = (status: string) => `${status === 'cancelled' ? 'text-red-500 bg-red-500/15' : status === 'drafted' ? 'text-blue-500 bg-blue-500/15' : status === 'completed' ? 'text-green-500 bg-green-500/15' : status ==='pending' ? 'text-yellow-500 bg-yellow-500/15' : ''} `;
