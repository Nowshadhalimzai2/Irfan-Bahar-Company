
interface Props{
    title:string;
    description?:string;
}
export const SectionTitle = ({title,description}:Props) => {
    return (
        <div>
            <h2 className="text-center text-primary font-semibold text-3xl mb-5">{title}</h2>
            {description!=="" &&<p className="text-sm text-muted-foreground mb-8 text-center">{description}</p>}
        </div>
    )
}
