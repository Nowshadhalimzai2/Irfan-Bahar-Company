import { SectionTitle } from "@/components/section-title";
import AppLayout from "@/layouts/app-layout";

const Home = () => {
  return (
    <AppLayout breadcrumbs={[
      { title: 'کارخانه', href: '/factory/home' },
    ]}>
      <div className="p-3">
        <div>
          <SectionTitle title="کارخانه" />
          <div className="flex justify-center items-center gap-2">
            <section className="w-2/3 border text-center p-5">اجناس</section>
            <section className="w-1/3 border text-center p-5">اردرس</section>
          </div>
        </div>
      </div>

    </AppLayout>
  )
}

export default Home