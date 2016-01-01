require 'sqlite3'

dict = {}

db = SQLite3::Database.new 'dict.sqlite'
query = 'SELECT word, content FROM japanese_vietnamese'
db.execute query do |row|
  word = row[0]
  dict[word] = {}
  contents = row[1]
  contents.scan(/(∴|^)([^∴]+)/).map { |c| c.join('') }.each do |content|
    writing = content.scan(/(∴)([^☆|◆|※]+)/)
    writing = !writing.empty? && writing.join('').strip || '_'
    writing = writing.gsub('「 ', '「').gsub('∴「', '').gsub('」', ' ').strip
    if writing.match(/^[^:|、|。]+$/)
      content.scan(/(☆)([^☆]+)/).map { |m| m.join('') }.each_with_index do |definition, index|
        mean = definition.scan(/(◆)([^◆|※]+)/)
        mean = !mean.empty? && mean.join('').strip || ''
        mean = mean && mean.gsub(' .', '').gsub('「 ', '「').gsub('[', '(').gsub(']', ')')
        if index == 0
          dict[word][writing] = mean
        else
          dict[word]['_'] = mean
        end
      end
    end
  end
end

File.foreach('dict.dat.old') do |line|
  content = line[0..-2].split('/')
  word_and_writing = content[0].split('[')
  word = word_and_writing[0].strip
  dict[word] = {} if dict[word] == nil
  if word_and_writing.size > 1
    writing = word_and_writing[1].split(']')[0].strip
  else
    writing = '_'
  end
  mean = content[1..-1].map { |c| '◆ ' + c }.join(' ')
  if dict[word][writing] == nil
    dict[word][writing] = mean
  else
    dict[word][writing] += '|' + mean
  end
end

File.open('dict.dat', 'w') do |file|
  dict.sort_by { |word, contents| word }.each do |word, contents|
    contents.each do |writing, mean|
      file.write(word + ' ')
      file.write('[' + writing + '] ') if writing != '_'
      file.write('/')
      file.write(mean + '/') if !mean.empty?
      file.write("\n")
    end
  end
end
