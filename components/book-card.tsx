import { Image, Text, View } from 'react-native';
import type { Book } from '../types/book';

export default function BookCard({ book }: { book: Book }) {
    const info = book.volumeInfo;
    return (
        <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            <Image
                source={{ uri: info.imageLinks?.thumbnail }}
                style={{ width: 50, height: 75, marginRight: 12 }}
            />
            <View>
                <Text style={{ fontWeight: 'bold' }}>{info.title}</Text>
                <Text>{info.authors?.join(', ')}</Text>
            </View>
        </View>
    );
}
