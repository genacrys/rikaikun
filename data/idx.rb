require 'sqlite3'

# count = 0
table = {}
idx = 0
File.open('log.txt', 'w') do |log|
  File.foreach('dict.dat') do |line|
    # count += 1
    begin
      word_and_kana = line.gsub(/\s+/, '').split('/')[0].split('[')
      word = word_and_kana[0]
      table[word] = [] if table[word] == nil
      table[word] << idx

      if word_and_kana.size > 1
        kana = word_and_kana[1].split(']')[0]
        table[kana] = [] if table[kana] == nil
        table[kana] << idx
      end
      idx += line.length
      # p count.to_s + ' ' + word
    rescue Exception => e
      # log.write('ERROR: ' + count.to_s + ' ' + word + e.message + "\n")
    end
  end
end

File.open('dict.idx', 'w') do |file|
  table.sort_by { |key, idx| key }.each do |key, idx|
    file.write(key)
    idx.each do |i|
      file.write(',' + i.to_s)
    end
    file.write("\n")
  end
end
