
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useColorScheme,
} from 'react-native';
import type { Book } from '../types/book';

// ─── env ───────────────────────────────────────────────────────────
const BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const BOOKS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY;

function getApiErrorMessage(error: unknown): string {
    if (error instanceof TypeError && error.message.includes('fetch')) {
        return 'Unable to connect. Check your internet connection and try again.';
    }
    if (error instanceof Error) {
        if (error.message.startsWith('API error: 429')) return 'Too many requests. Please try again in a moment.';
        if (error.message.startsWith('API error: 5')) return 'Something went wrong on our end. Please try again later.';
        if (error.message.startsWith('API error: 4')) return 'Request failed. Please check your connection and try again.';
    }
    return 'Something went wrong. Please try again.';
}

export async function fetchPopularBooks(): Promise<{ data: Book[]; error: string | null }> {
    try {
        const params = new URLSearchParams({
            q: 'subject:fiction',
            orderBy: 'relevance',
            maxResults: '15',
            ...(BOOKS_API_KEY && { key: BOOKS_API_KEY }),
        });
        const url = `${BOOKS_API_BASE}?${params.toString()}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data = await res.json();
        return { data: data.items ?? [], error: null };
    } catch (e) {
        console.error('Failed to fetch popular books:', e);
        return { data: [], error: getApiErrorMessage(e) };
    }
}

// ─── Star Rating ──────────────────────────────────────────────────────────────

const StarRating = ({ rating }: { rating?: number }) => {
    const filled = rating != null ? Math.min(5, Math.round(rating)) : 0;
    return (
        <View style={styles.stars}>
            {Array.from({ length: 5 }).map((_, i) => (
                <Ionicons
                    key={i}
                    name={i < filled ? 'star' : 'star-outline'}
                    size={14}
                    color="#FFC107"
                    style={styles.starIcon}
                />
            ))}
        </View>
    );
};

// ─── Book Row ─────────────────────────────────────────────────────────────────

const BookRow = ({
    book,
    isDark,
    onPress,
}: {
    book: Book;
    isDark: boolean;
    onPress: () => void;
}) => {
    const { volumeInfo } = book;
    const thumbnail =
        volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') ||
        volumeInfo.imageLinks?.smallThumbnail?.replace('http://', 'https://');

    return (
        <TouchableOpacity
            style={[styles.bookCard, isDark && styles.bookCardDark]}
            activeOpacity={0.7}
            onPress={onPress}
        >
            {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.cover} resizeMode="cover" />
            ) : (
                <View style={[styles.cover, styles.coverPlaceholder]}>
                    <Ionicons name="book" size={28} color="#9E9E9E" />
                </View>
            )}
            <View style={styles.rowInfo}>
                <Text style={[styles.bookTitle, isDark && styles.textDark]} numberOfLines={2}>
                    {volumeInfo.title}
                </Text>
                <Text style={[styles.bookAuthor, isDark && styles.authorDark]} numberOfLines={1}>
                    by {volumeInfo.authors?.join(', ') ?? 'Unknown'}
                </Text>
                <StarRating rating={volumeInfo.averageRating} />
            </View>
        </TouchableOpacity>
    );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [books, setBooks] = useState<Book[]>([]);
    const [popularBooks, setPopularBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingPopular, setLoadingPopular] = useState(true);
    const [errorPopular, setErrorPopular] = useState<string | null>(null);
    const [errorSearch, setErrorSearch] = useState<string | null>(null);
    const inputRef = useRef<TextInput>(null);
    const router = useRouter();
    const colorScheme = useColorScheme();
    const isDark = colorScheme === 'dark';

    // Auto-focus input on mount
    useEffect(() => {
        const timeout = setTimeout(() => inputRef.current?.focus(), 100);
        return () => clearTimeout(timeout);
    }, []);

    // Fetch popular books on mount (when no query)
    const loadPopularBooks = () => {
        setErrorPopular(null);
        setLoadingPopular(true);
        fetchPopularBooks().then(({ data, error }) => {
            setPopularBooks(data);
            setErrorPopular(error);
        }).finally(() => setLoadingPopular(false));
    };

    useEffect(() => {
        let cancelled = false;
        setLoadingPopular(true);
        setErrorPopular(null);
        fetchPopularBooks().then(({ data, error }) => {
            if (!cancelled) {
                setPopularBooks(data);
                setErrorPopular(error);
            }
        }).finally(() => {
            if (!cancelled) setLoadingPopular(false);
        });
        return () => { cancelled = true; };
    }, []);

    // Debounced search — fires 400ms after user stops typing
    useEffect(() => {
        if (!query.trim()) {
            setBooks([]);
            return;
        }
        const timer = setTimeout(() => fetchBooks(query), 400);
        return () => clearTimeout(timer);
    }, [query]);

    const navigateToBook = (item: Book) => {
        Keyboard.dismiss();
        router.push(`/book/${encodeURIComponent(item.id)}` as never);
    };

    const fetchBooks = async (q: string) => {
        setErrorSearch(null);
        setLoading(true);
        try {
            const params = new URLSearchParams({
                q: q.trim(),
                maxResults: '20',
                ...(BOOKS_API_KEY && { key: BOOKS_API_KEY }),
            });
            const url = `${BOOKS_API_BASE}?${params.toString()}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            setBooks(data.items ?? []);
        } catch (e) {
            console.error('Search failed:', e);
            setBooks([]);
            setErrorSearch(getApiErrorMessage(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={[styles.container, isDark && styles.containerDark]}>
            {/* Header: back button */}
            {/* <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                <Ionicons
                    name="arrow-back"
                    size={24}
                    color={isDark ? '#A5B4FC' : '#5C6BC0'}
                />
            </TouchableOpacity> */}

            {/* Search bar */}
            <View style={[styles.searchBar, isDark && styles.searchBarDark]}>
                <Ionicons
                    name="search"
                    size={18}
                    color="#9E9E9E"
                    style={styles.searchIcon}
                />
                <TextInput
                    ref={inputRef}
                    style={[styles.searchInput, isDark && styles.searchInputDark]}
                    placeholder="Search Books..."
                    placeholderTextColor="#9E9E9E"
                    value={query}
                    onChangeText={setQuery}
                    returnKeyType="search"
                    autoCorrect={false}
                    autoCapitalize="none"
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => setQuery('')}>
                        <Ionicons name="close-circle" size={18} color="#9E9E9E" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Book list: search results or popular books */}
            {loading ? (
                <ActivityIndicator size="large" color="#5C6BC0" style={styles.loader} />
            ) : query.trim() ? (
                <FlatList
                    data={books}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookRow
                            book={item}
                            isDark={isDark}
                            onPress={() => navigateToBook(item)}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={[
                        styles.listContent,
                        books.length === 0 && styles.emptyList,
                    ]}
                    ListEmptyComponent={
                        !loading ? (
                            errorSearch ? (
                                <View style={styles.emptyList}>
                                    <Ionicons name="cloud-offline" size={48} color="#9E9E9E" style={{ marginBottom: 12 }} />
                                    <Text style={[styles.errorMessage, isDark && styles.errorMessageDark]}>
                                        {errorSearch}
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.retryButton}
                                        onPress={() => fetchBooks(query)}
                                    >
                                        <Text style={styles.retryButtonText}>Try again</Text>
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                                    No results found for "{query}"
                                </Text>
                            )
                        ) : null
                    }
                />
            ) : loadingPopular ? (
                <ActivityIndicator size="large" color="#5C6BC0" style={styles.loader} />
            ) : errorPopular ? (
                <View style={[styles.errorState, styles.emptyList]}>
                    <Ionicons name="cloud-offline" size={48} color="#9E9E9E" style={{ marginBottom: 12 }} />
                    <Text style={[styles.errorMessage, isDark && styles.errorMessageDark]}>
                        {errorPopular}
                    </Text>
                    <TouchableOpacity style={styles.retryButton} onPress={loadPopularBooks}>
                        <Text style={styles.retryButtonText}>Try again</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={popularBooks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <BookRow
                            book={item}
                            isDark={isDark}
                            onPress={() => navigateToBook(item)}
                        />
                    )}
                    ItemSeparatorComponent={() => <View style={styles.cardSeparator} />}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={styles.listContent}
                    ListHeaderComponent={
                        popularBooks.length > 0 ? (
                            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                                Popular Books
                            </Text>
                        ) : null
                    }
                />
            )}
        </View>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 60,
        paddingHorizontal: 20,
        backgroundColor: '#F8F8F8',
    },
    containerDark: {
        backgroundColor: '#121212',
    },
    backBtn: {
        alignSelf: 'flex-start',
        padding: 8,
        marginBottom: 16,
        marginLeft: -8,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        width: '100%',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        marginBottom: 16,
    },
    searchBarDark: {
        backgroundColor: '#2C2C2E',
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: '#212121',
        paddingVertical: 0,
    },
    searchInputDark: {
        color: '#F5F5F5',
    },
    loader: {
        marginTop: 40,
    },
    listContent: {
        paddingBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#212121',
        marginBottom: 12,
    },
    sectionTitleDark: {
        color: '#F5F5F5',
    },
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 12,
        marginHorizontal: 0,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    bookCardDark: {
        backgroundColor: '#1E1E1E',
    },
    cover: {
        width: 56,
        height: 84,
        borderRadius: 4,
        marginRight: 14,
    },
    coverPlaceholder: {
        backgroundColor: '#EEEEEE',
        justifyContent: 'center',
        alignItems: 'center',
    },
    rowInfo: {
        flex: 1,
        justifyContent: 'center',
        minHeight: 84,
    },
    bookTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#212121',
        lineHeight: 21,
        marginBottom: 4,
    },
    textDark: {
        color: '#F5F5F5',
    },
    bookAuthor: {
        fontSize: 13,
        color: '#757575',
        marginBottom: 4,
    },
    authorDark: {
        color: '#B0B0B0',
    },
    stars: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    starIcon: {
        marginRight: 2,
    },
    cardSeparator: {
        height: 10,
    },
    emptyList: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 40,
    },
    emptyText: {
        fontSize: 14,
        color: '#9E9E9E',
        textAlign: 'center',
    },
    emptyTextDark: {
        color: '#B0B0B0',
    },
    errorState: {
        paddingTop: 40,
    },
    errorMessage: {
        fontSize: 15,
        color: '#616161',
        textAlign: 'center',
        paddingHorizontal: 24,
        marginBottom: 16,
    },
    errorMessageDark: {
        color: '#B0B0B0',
    },
    retryButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        backgroundColor: '#5C6BC0',
        borderRadius: 8,
    },
    retryButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});