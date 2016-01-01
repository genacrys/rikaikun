require 'sqlite3'

dict = {}

File.open('log_data.tmp', 'w') do |log|
  # count = 0
  db = SQLite3::Database.new 'jv.db'
  query = 'SELECT word, content FROM japanese_vietnamese'
  db.execute query do |row|
    word = row[0]
    dict[word] = {}
    contents = row[1]
    contents.scan(/(∴|^)([^∴]+)/).map { |c| c.join('') }.each do |content|
      writing = content.scan(/(∴)([^☆|◆|※]+)/)
      writing = !writing.empty? && writing.join('').gsub('「 ', '「').strip || '_'
      if writing.match(/^[^:|、|。]+$/)
        mean = content.scan(/(◆)([^☆|※]+)/)
        mean = !mean.empty? && mean.join('').strip || ''
        mean = mean && mean.gsub(' .', '').gsub('「 ', '「').gsub('[', '(').gsub(']', ')')
        dict[word][writing] = mean
      end
    end

  end

  # File.foreach('dict.dat.old') do |line|
  #   # count += 1
  #   begin
  #     word = line.gsub(/\s+/, '').split('/')[0].split('[')[0]
  #     # p count.to_s + ' ' + word
  #   rescue Exception => e
  #     # log.write('ERROR: ' + count.to_s + ' ' + word + ' '  + e.message + "\n")
  #   end
  # end
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
