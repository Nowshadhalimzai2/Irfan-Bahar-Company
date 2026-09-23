



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
export const getDariCurrency = (currency: string) => currency === 'AFG' ? 'افغانی' : currency === 'PKR' ? 'کلداری' : currency === 'USD' ? 'دالر' : currency;
export const getUnitOfMeasurements = () => [{ value: 'kg', label: 'کیلو' }, { value: 'gr', label: 'ګرام' }, { value: 'ltr', label: 'لیتر' }, { value: 'packet', label: 'پاکت' }, { value: 'carton', label: 'کارتن' }, { value: 'bundle', label: 'بسته' }, { value: 'pair', label: 'جوره' }, { value: 'unit', label: 'دانه' }, { value: 'bag', label: 'بوجی' }];


export const getSingleUnitWeight = (weight: number, per_pack: number = 1) => (weight / per_pack).toFixed(3);
export const getDariOrderStatus = (status: string) => status === 'pending' ? 'انتظار ' : status === 'progress' ? 'جریان' : status === 'completed' ? 'تکمیل شده' : status === 'cancelled' ? 'لغو شده' : status === 'drafted' ? 'پیش نویس شده' : status;
export const getStatusColor = (status: string) => `${status === 'cancelled' ? 'text-red-500 bg-red-500/15' : status === 'drafted' ? 'text-blue-500 bg-blue-500/15' : status === 'completed' ? 'text-green-500 bg-green-500/15' : status === 'pending' ? 'text-yellow-500 bg-yellow-500/15' : status === 'progress' ? 'text-cyan-500 bg-cyan-500/15' : ''} `;

export const getDariEmpPosition = (position: string) => position === "worker" ? "کاریګر" : position === "machine_operator" ? "استاد ماشین" : position === "shopkeeper" ? "دوکاندار" : position === "clerk" ? "منشی" : position === "other" ? "دیګر" : position;

export const getDariMonthName = (monthNumber: string) => {


    try {

        Number(monthNumber);
        let monthName: string = '';

        switch (monthNumber) {
            case '1':
                monthName = 'حمل';
                break;
            case '2':
                monthName = 'ثور';
                break;
            case '3':
                monthName = 'جوزا';
                break;
            case '4':
                monthName = 'سرطان';
                break;
            case '5':
                monthName = 'اسد';
                break;
            case '6':
                monthName = 'سنبله';
                break;
            case '7':
                monthName = 'میزان';
                break;
            case '8':
                monthName = 'عقرب';
                break;
            case '9':
                monthName = 'قوس';
                break;
            case '10':
                monthName = 'جدی';
                break;
            case '11':
                monthName = 'دلوه';
                break;
            case '12':
                monthName = 'حوت';
                break;

            default:
                monthName = 'ماه ' + monthNumber;
        }
        return monthName;
    } catch (error) {
        return 'parameter is not a number'
    }
}