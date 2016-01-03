require 'sqlite3'

db_kanji = SQLite3::Database.new 'kanji.sqlite'
kanji = {}
db_kanji.execute('SELECT * FROM kanji') do |row|
  contents = {}
  contents[:han] = row[1] || ''
  contents[:onyomi] = row[2] || ''
  contents[:kunyomi] = row[3] || ''
  contents[:meaning] = row[4] || ''
  contents[:stroke_count] = row[5] || ''
  contents[:parts] = row[6] || ''
  contents[:examples] = row[7] || ''
  contents[:level] = row[8] || ''
  kanji[row[0]] = contents
end

File.open('kanji.dat', 'w') do |file|
  kanji.sort_by { |kanji, contents| kanji }.each do |kanji, contents|
    file.write(kanji + '|')
    file.write(contents[:han] + '|')
    file.write(contents[:onyomi] + '|')
    file.write(contents[:kunyomi] + '|')
    file.write(contents[:meaning].gsub(' .', '.') + '|')
    file.write(contents[:stroke_count].to_s + '|')
    file.write(contents[:parts].gsub(' .', '.') + '|')
    file.write(contents[:examples].gsub(' .', '.') + '|')
    file.write(contents[:level].to_s + "\n")
  end
end
