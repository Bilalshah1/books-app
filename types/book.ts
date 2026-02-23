
export interface BookImageLinks {
    thumbnail?: string;
    smallThumbnail?: string;
    small?: string;
    medium?: string;
    large?: string;
}

export interface BookVolumeInfo {
    title: string;
    authors?: string[];
    averageRating?: number;
    description?: string;
    imageLinks?: BookImageLinks;
}


export interface Book {
    id: string;
    volumeInfo: BookVolumeInfo;
}

export interface BookDetailParams {
    id: string;
    title?: string;
    authors?: string;
    thumbnail?: string;
    rating?: string;
    description?: string;
}
