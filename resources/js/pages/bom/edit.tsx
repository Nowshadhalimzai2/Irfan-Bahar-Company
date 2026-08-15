import { BOM, BOMLine } from '@/types';
import { SectionTitle } from '@/components/section-title';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import InputError from '@/components/input-error';

import LocationTranslator, { getDariItemUnit } from '@/components/location-translator';
import { Item, Product } from '@/types/item';

interface Props {
    products: Product[];
    items: Item[];
    bom: {
        id: number;
        formula_name: string;
        product_id: number;
        min_exp_qty: number;
        max_exp_qty: number;
        bom_lines: { item_id: number; required_quantity: number }[];

    };
}

// type BOMLine = {

//   item_id: number;
//   required_quantity: number;
// }

type BOMType = {
    formula_name: string;
    product_id: number;
    min_exp_qty: number;
    max_exp_qty: number;
    bomLines: { item_id: number; required_quantity: number }[];
}

const Edit = ({ products, items, bom }: Props) => {
    const [BOMLine, setBOMLine] = useState<{ item_id: number; required_quantity: number }[]>(bom.bom_lines);
    const [lineError, setLineError] = useState<string | null>(null);

    const [currentLine, setCurrentLine] = useState<{
        item_id: number;
        required_quantity: number;
    }>(() => ({
        item_id: items[0]?.id ?? 0,
        required_quantity: 1,
    }));

    console.log('item types:: ', bom.bom_lines);

    const { data, setData, errors, put, processing } = useForm<BOMType>({
        'formula_name': bom.formula_name,
        'product_id': bom.product_id,
        'min_exp_qty': bom.min_exp_qty,
        'max_exp_qty': bom.max_exp_qty,
        'bomLines': bom.bom_lines,
    });

    useEffect(() => {
        setData('bomLines', BOMLine);
    }, [BOMLine, setData]);

    const handleBom = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        put('/boms/' + bom.id, {
            onFinish: () => {
                setBOMLine([]);
                setCurrentLine({
                    item_id: items[0]?.id ?? 1,
                    required_quantity: 1,
                });
            },
        });
    };

    const handleAddLine = () => {

        if (!currentLine.item_id || currentLine.required_quantity <= 0) {
            return;
        }

        // prevent adding the same item twice
        if (BOMLine.some((l) => l.item_id === currentLine.item_id)) {
            setLineError('این جنس قبلا اضافه شده است');
            return;
        }

        setBOMLine((prev) => [...prev, currentLine]);
        setCurrentLine((prev) => ({
            ...prev,
            required_quantity: 1,
        }));
        setLineError(null);
    };

    const handleRemoveLine = (index: number) => {
        setBOMLine((prev) => prev.filter((_, i) => i !== index));
    };
    console.log(products);

    const itemUnit = useMemo(() => {
        if (items.length === 0)
            return 'unit';
        return items.filter(item => item.id === currentLine.item_id)[0].unit;

    }, [currentLine]);
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'دشبورد', href: '/dashbaord' },
                { title: 'لیست فورموله ها', href: '/boms' },
                { title: bom.formula_name, href: '/boms/' + bom.id },
                { title: 'ویرایش فورمول', href: '/boms/' + bom.id + '/edit' },
            ]}
        >
            <div className="section">
                <section>
                    <div className="max-w-3xl mx-auto p-5">
                        <SectionTitle title={' فورم برروز رسانی '+bom.formula_name} />
                        <div className="pt-5">
                            <form onSubmit={handleBom} name="receipt" id="receipt">
                                <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="formula_name">نام فورمول</Label>
                                        <Input
                                            className="border p-1.5 rounded-md text-sm"
                                            tabIndex={2}
                                            name="formula_name"
                                            value={data.formula_name}
                                            onChange={(e) =>
                                                setData('formula_name', e.target.value)
                                            }
                                            placeholder="نام فورمول را داخل کنین"
                                        />
                                        <InputError message={errors.formula_name} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="product_id">جنس تولید</Label>
                                        <select
                                            className="border p-1.5 rounded-md"
                                            tabIndex={2}
                                            name="product_id"
                                            value={data.product_id}
                                            onChange={(e) =>
                                                setData('product_id', Number(e.target.value))
                                            }
                                        >
                                            <option value={0}>جنس که برای فورمول ساخته میشود</option>
                                            {products.map((product) => (
                                                <option value={product.item_id} key={product.item_id} >
                                                    {product.item.name}
                                                </option>
                                            ))}
                                        </select>
                                        <InputError message={errors.product_id} className="mt-2" />
                                    </div>

                                    <div className="grid gap-2 mt-5">
                                        <Label htmlFor="min_exp_qty">مقدار تخمینی حداقل</Label>
                                        <Input
                                            className="border p-1.5 rounded-md text-sm"
                                            tabIndex={2}
                                            name="min_exp_qty"
                                            value={data.min_exp_qty}
                                            onChange={(e) =>
                                                setData('min_exp_qty', Number(e.target.value))
                                            }
                                            placeholder="مقدار جنس تخمینی را وارد کنید که حداقل باید تولید شود"
                                        />

                                        <InputError message={errors.min_exp_qty} className="mt-2" />
                                    </div>
                                    <div className="grid gap-2 mt-5">
                                        <Label htmlFor="max_exp_qty">مقدار تخمینی حداکثر</Label>
                                        <Input
                                            className="border p-1.5 rounded-md text-sm"
                                            tabIndex={2}
                                            name="max_exp_qty"
                                            value={data.max_exp_qty}
                                            onChange={(e) =>
                                                setData('max_exp_qty', Number(e.target.value))
                                            }
                                            placeholder="مقدار جنس تخمینی را وارد کنید که حداکثر باید تولید شود"
                                        />

                                        <InputError message={errors.max_exp_qty} className="mt-2" />
                                    </div>
                                </div>

                                <section className=" ITEMSection mt-12 border-t">
                                    <div>
                                        <h3 className="text-lg text-center font-medium py-8">مواد خام را اضافه کنید</h3>
                                        <div className="grid gap-6   grid-cols-1 md:grid-cols-2 ">

                                            <div className="grid gap-2">
                                                <Label htmlFor="item_id">مواد خام یا پیکنګ</Label>
                                                <select
                                                    className="border p-1.5 rounded-md"
                                                    name="item_id"
                                                    tabIndex={5}
                                                    value={currentLine.item_id}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            item_id: Number(e.target.value),
                                                        }))
                                                    }
                                                >
                                                    {items.map((item) => (
                                                        <option value={item.id} key={item.id}>
                                                            {item.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError message={errors.bomLines} className="mt-2" />

                                            </div>

                                            <div className="grid gap-2">
                                                <Label htmlFor="quantity" className="flex justify-between">
                                                    <span>  مقدار  </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {currentLine.required_quantity} {getDariItemUnit(itemUnit)}
                                                    </span>
                                                </Label>
                                                <Input
                                                    id="quantity"
                                                    type="number"
                                                    min={1}
                                                    // max={items[currentLine.item_id]}
                                                    value={currentLine.required_quantity}
                                                    onChange={(e) =>
                                                        setCurrentLine((prev) => ({
                                                            ...prev,
                                                            required_quantity: Number(e.target.value),
                                                        }))
                                                    }
                                                    placeholder="مقدار"
                                                    className="border p-1.5 rounded-md"
                                                />
                                                <InputError message={errors.bomLines} className="mt-2" />

                                            </div>


                                        </div>

                                        <div className="mt-4">
                                            <Button
                                                type="button"
                                                className="w-full"
                                                variant={'secondary'}
                                                tabIndex={6}
                                                onClick={handleAddLine}
                                            >
                                                اضافه کردن جنس
                                            </Button>
                                        </div>
                                        {lineError && <div className="mt-2"><InputError message={lineError} /></div>}
                                    </div>
                                </section>



                                {/* ================================  RESULTS  =============================================== */}
                                {BOMLine.length > 0 && (
                                    <div className="mt-6 overflow-hidden py-5 rounded-lg border">
                                        <h3 className="text-lg text-center font-medium">مواد خام که در ساختن محصول استفاده میشود</h3>

                                        <div className="divide-y">
                                            {BOMLine.map((line, index) => (
                                                <div
                                                    key={`${line.item_id}-${index}`}
                                                    className="flex flex-col gap-2 border-b px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div>
                                                        <div className="space-y-1 gap-3 text-sm grid grid-cols-3">
                                                            <div className=" p-5 border rounded-sm bg-white">جنس: {items.find((item) => item.id === line.item_id)?.name || line.item_id}</div>

                                                            <div className=" p-5 border rounded-sm bg-white">مقدار: {line.required_quantity} {getDariItemUnit(itemUnit)}</div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        onClick={() => handleRemoveLine(index)}
                                                    >
                                                        حذف
                                                    </Button>
                                                </div>
                                            ))}
                                           
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        tabIndex={7}
                                        data-test="update-bom-button"
                                    >
                                        {processing && <Spinner />}
                                        برروز رسانی
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
};

export default Edit;