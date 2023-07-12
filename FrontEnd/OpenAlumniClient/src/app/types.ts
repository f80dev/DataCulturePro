//Correspond au profil extra user de models.py
export interface tUser {
    user:{
        email:string,
        id:string,      //Contient l'id du user
    },
    perm:string
    profil:string //Contient l'id du profil
    level: number | null
    black_list: string | null
    profil_name: string | null
    dtLogin: string | null
    nbLogin: number | null
    dtCreate: string
}

export interface tProfil {
    id: string

    gender: string
    choices:string
    firstname:string
    lastname: string
    name_index: string

    public_photo: boolean
    birthdate: string
    mobile: string
    nationality: string

    department: string
    department_pro: string
    department_category: string

    job: string
    degree_year: string

    linkedin: string | null
    email: string
    instagram: string | null
    telegram: string | null
    facebook: string | null
    twitter: string | null
    tiktok: string | null
    youtub: string | null
    vimeo: string | null
    school: string | null

    unifrance :string | null
    imdb  :string | null
    wikipedia :string | null
    allocine :string | null

    crm :string | null

    acceptSponsor :boolean
    sponsorBy :string | null

    photo :string | null

    cursus :string
    address :string | null
    town  :string | null
    cp :string | null
    country :string | null

    backgroundColor: string
    website :string | null
    dtLastUpdate :string | null
    dtLastSearch :string | null
    dtLastNotif :string | null
    obsolescenceScore :number | null
    biography :string | null
    links  :string | null
    auto_updates :string | null
    advices :string | null
    source :string | null
    blockchain :string | null

    message: string | null
}

export interface tArticle {
    id: string,
    owner: string
    validate: boolean
    html: string
    title: string
    sumary: string
    dtPublish: string
    dtCreate : string
    tags: string
    to_publish: boolean
}


export interface tProfilPerms {
    id: string
    title: string
    level: number
    presentation: string
    description: string
    perm: string
    price: number
    subscription: "secure" | "online" | "email"
}
