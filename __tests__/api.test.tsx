import { fetchBookById } from '../app/book/[id]';
import { fetchPopularBooks } from '../app/search';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('fetchPopularBooks', () => {
        it('fetches popular books successfully', async () => {
            const mockResponse = {
                items: [
                    {
                        id: '1',
                        volumeInfo: {
                            title: 'Test Book',
                            authors: ['Author'],
                        },
                    },
                ],
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            });

            const result = await fetchPopularBooks();

            expect(result.error).toBeNull();
            expect(result.data).toHaveLength(1);
            expect(result.data[0].volumeInfo.title).toBe('Test Book');
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('https://www.googleapis.com/books/v1/volumes')
            );
        });

        it('handles API error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 500,
            });

            const result = await fetchPopularBooks();

            expect(result.error).toBe('Something went wrong on our end. Please try again later.');
            expect(result.data).toEqual([]);
        });

        it('handles network error', async () => {
            (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Failed to fetch'));

            const result = await fetchPopularBooks();

            expect(result.error).toBe('Unable to connect. Check your internet connection and try again.');
            expect(result.data).toEqual([]);
        });
    });

    describe('fetchBookById', () => {
        it('fetches book by ID successfully', async () => {
            const mockBook = {
                id: '123',
                volumeInfo: {
                    title: 'Book Title',
                    authors: ['Author Name'],
                },
            };

            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: true,
                json: jest.fn().mockResolvedValue(mockBook),
            });

            const result = await fetchBookById('123');

            expect(result.error).toBeNull();
            expect(result.book).toEqual(mockBook);
            expect(global.fetch).toHaveBeenCalledWith(
                'https://www.googleapis.com/books/v1/volumes/123'
            );
        });

        it('handles book not found', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 404,
            });

            const result = await fetchBookById('invalid-id');

            expect(result.error).toBe('Book could not be loaded. Please try again.');
            expect(result.book).toBeNull();
        });

        it('handles rate limit error', async () => {
            (global.fetch as jest.Mock).mockResolvedValueOnce({
                ok: false,
                status: 429,
            });

            const result = await fetchBookById('123');

            expect(result.error).toBe('Too many requests. Please try again in a moment.');
            expect(result.book).toBeNull();
        });
    });
});