require 'sqlite3'

db = SQLite3::Database.new 'jv.db'
# count = 0
File.open('log.txt', 'w') do |log|
  File.open('dict.dat', 'w') do |file|
    File.foreach('dict.dat.old') do |line|
      # count += 1
      begin
        word = line.gsub(/\s+/, '').split('/')[0].split('[')[0]
        query = 'SELECT content FROM japanese_vietnamese WHERE word = \'' + word + '\''
        means = nil
        db.execute query do |content|
          means = content[0].split('◆').map { |m| m.split(/※|∴|☆/)[0].strip }
        end
        file.write(line[0..-2])
        if means != nil
          mean = means[1..-1].join('/').gsub(' .', '.')
          file.write('|' + mean + '/' + "\n")
        else
          file.write("\n")
        end
        # p count.to_s + ' ' + word
      rescue Exception => e
        # log.write('ERROR: ' + count.to_s + ' ' + word + e.message + "\n")
      end
    end
  end
end
