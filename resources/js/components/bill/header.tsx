
interface Props {
    logo: string;
    title?: string;
}
const Header = ({logo,title ='bill'}:Props) => {
    return (
        <div className="mt-5">
            <div className='flex justify-between items-start gap-5'>
                <div>
                    <img src={logo} alt="LOGO" className="w-28 h-35" />
                </div>
                <div>
                    <h3 className="text-2xl text-accent font-bold text-center">شرکت تولیدی و بسته بندی</h3>
                    <h3 className="text-3xl font-bold text-primary text-center">عرفان بهار</h3>
                </div>
                <div>
                    <img src={logo} alt="LOGO" className="w-28 h-35" />
                </div>
            </div>
            <div className="flex text-center text-sm px-12 mt-8 text-muted-foreground justify-center items-center flex-col space-y-3">
                {title ==='bill' ? <p className="">دلته هر قسم دکالیو مینځلو شامپو، صابون،پودر شامپو بیس، سلفونیک، رنګ صنعتی، عطر مالګه او د واسلین او مایع جوړولو ټول د اړتیا
                    وړ مواد په عمده او پرچون ډول د بازار څخه په مناسبه بیه ترلاسه کولی شئ.
                </p> : <p className="text-2xl text-accent mb-4 font-semibold ">{title}</p>}
                <h5 className="text-lg text-secondary-foreground font-semibold ">مسؤل: عبدالقاهر صدیقی</h5>
                <div className="flex pb-2  justify-between items-center gap-5 w-full">
                    <div>
                        <span>irfanbahar@gmail.com</span>
                        <span> : ایمیل </span>
                    </div>
                    <div>
                        <span>شماره ها تماس : </span><span>0782641141</span><span>/ 0703599035</span>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Header