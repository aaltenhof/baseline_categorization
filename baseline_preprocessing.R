setwd("baseline_ratings/")
temp_q <- list.files(pattern="*.csv")

# Create a list to store both the data and filenames
q_2_data <- lapply(temp_q, function(filename) {
  df <- read_csv(filename, show_col_types = FALSE)
  # Add the subCode column with the filename (removing .csv extension)
  df$subCode <- tools::file_path_sans_ext(filename)
  return(df)
})

# Combine all dataframes
temp_q <- rbindlist(temp_q, fill = TRUE)

write_csv(q_2, 'baseline_ratings.csv')