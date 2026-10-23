-- Gotowy zestaw pytań: muzyka popularna.
-- Klucz odpowiedzi zapisany jest w `dane`; aplikacja ujawnia go dopiero po odpowiedzi.
-- Kolejność albumów Taylor Swift: Fearless (2008), Red (2012), 1989 (2014), Midnights (2022).
with nowy_quiz as (
  insert into public.quizy (tytul, opis)
  values (
    'Muzyka popularna: od Beatlesów do współczesności',
    'Przeboje, wykonawcy i albumy z kilku dekad.'
  )
  returning id
)
insert into public.zadania (quiz_id, nr, typ, tresc, dane)
select nowy_quiz.id, pytania.nr, pytania.typ, pytania.tresc, pytania.dane::jsonb
from nowy_quiz
cross join (values
  (1, 'wybor', 'Który zespół nagrał album „Abbey Road”?', '{"odpowiedzi":["The Rolling Stones","The Beatles","The Who","The Kinks"],"poprawna":1}'),
  (2, 'szacowanie', 'W którym roku ukazał się album „Abbey Road”?', '{"min":1950,"max":2020,"krok":1,"tolerancja":5,"jednostka":null,"poprawna":1969}'),
  (3, 'wielokrotny', 'Które utwory pochodzą z albumu „Thriller” Michaela Jacksona?', '{"odpowiedzi":["Billie Jean","Like a Virgin","Beat It","Purple Rain","Human Nature"],"poprawna":[0,2,4]}'),
  (4, 'wybor', 'Kto zaśpiewał z Lady Gagą duet „Shallow”?', '{"odpowiedzi":["Bradley Cooper","Bruno Mars","Sam Smith","Justin Timberlake"],"poprawna":0}'),
  (5, 'prawda_falsz', '„Like a Prayer” to piosenka Madonny.', '{"odpowiedzi":["Prawda","Fałsz"],"poprawna":0}'),
  (6, 'wielokrotny', 'Którzy wykonawcy wydali album zatytułowany „1989”?', '{"odpowiedzi":["Taylor Swift","Katy Perry","David Bowie","Ryan Adams"],"poprawna":[0,3]}'),
  (7, 'szacowanie', 'Ile nagród Grammy zdobył Michael Jackson podczas gali w 1984 roku?', '{"min":0,"max":10,"krok":1,"tolerancja":2,"jednostka":"nagród","poprawna":8}'),
  (8, 'pary', 'Połącz wykonawcę z utworem.', '{"lewe":["Adele","Queen","ABBA","Nirvana"],"prawe":["Dancing Queen","Smells Like Teen Spirit","Rolling in the Deep","Bohemian Rhapsody"],"poprawna":[2,3,0,1]}'),
  (9, 'wybor', 'Który artysta wydał album „Purple Rain”?', '{"odpowiedzi":["Prince","Lionel Richie","George Michael","Stevie Wonder"],"poprawna":0}'),
  (10, 'wielokrotny', 'Które z tych zespołów pochodzą ze Szwecji?', '{"odpowiedzi":["Roxette","a-ha","ABBA","Ace of Base","The Cardigans"],"poprawna":[0,2,3,4]}'),
  (11, 'kolejnosc', 'Ułóż te albumy Taylor Swift od najwcześniejszego do najpóźniejszego wydania.', '{"elementy":["1989","Fearless","Midnights","Red"],"poprawna":[1,3,0,2]}'),
  (12, 'szacowanie', 'W którym roku Taylor Swift zdobyła czwartą nagrodę Grammy za album roku?', '{"min":2000,"max":2030,"krok":1,"tolerancja":3,"jednostka":null,"poprawna":2024}'),
  (13, 'prawda_falsz', 'Freddie Mercury był wokalistą zespołu Queen.', '{"odpowiedzi":["Prawda","Fałsz"],"poprawna":0}'),
  (14, 'wybor', 'Który duet nagrał przebój „Under Pressure”?', '{"odpowiedzi":["Queen i David Bowie","The Beatles i Elton John","ABBA i Olivia Newton-John","U2 i Bruce Springsteen"],"poprawna":0}')
) as pytania(nr, typ, tresc, dane)
order by pytania.nr;
